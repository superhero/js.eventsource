/**
 * @memberof Eventsource.Server.Domain
 * @extends {superhero/core/locator/constituent}
 */
class Process
{
  constructor(redis, publisher, mapper, deepmerge, eventbus, console)
  {
    this.redis          = redis
    this.redisPublisher = publisher
    this.mapper         = mapper
    this.deepmerge      = deepmerge
    this.eventbus       = eventbus
    this.console        = console
  }

  async onProcessEventQueued()
  {
    if(!this._processingEventQueue)
    {
      this._processingEventQueue = true
      try
      {
        const channel = this.mapper.toProcessEventQueuedChannel()
        while(await this.redis.stream.readGroup(channel, channel, this.persistProcess.bind(this)));
      }
      catch(error)
      {
        this.eventbus.emit('process-error', error)
      }
      finally
      {
        delete this._processingEventQueue
      }
    }
  }

  /**
   * @param {Eventsource.Schema.EntityProcess} event 
   */
  async persistProcess(id, event)
  {
    const 
      broadcast   = event.broadcast === undefined ? true : false,
      process     = this.mapper.toEntityProcess(event),
      { timestamp, domain, pid, name, data } = process,
      seKey       = this.mapper.toScoredEventKey(domain),
      peKey       = this.mapper.toProcessEventsKey(domain, pid),
      psKey       = this.mapper.toProcessStateKey(domain, pid),
      phKey       = this.mapper.toProcessHistoryKey(domain, pid),
      eiKey       = this.mapper.toEventIndexKey(domain, name),
      score       = this.mapper.toScore(timestamp),
      maxAttempts = 10

    let committed, i = 0
    
    do
    {
      const session = await this.redis.createSession()

      try
      {
        await session.transaction.watch(seKey)
        await session.transaction.watch(peKey)
        await session.transaction.watch(psKey)
        await session.transaction.watch(phKey)
        await session.transaction.watch(eiKey)
        await session.transaction.begin()
        await session.ordered.write(seKey, score, id)
        await session.hash.write(peKey, name, { id, timestamp })
        await session.list.rpush(phKey, { id, timestamp })
        await session.list.rpush(eiKey, { pid, timestamp })
        const state = await this.redis.key.read(psKey) || {}
        this.deepmerge.merge(state, data)
        await session.key.write(psKey, state)
        committed = await session.transaction.commit()
      }
      catch(previousError)
      {
        if(i >= 10)
        {
          throw previousError
        }
        else
        {
          // not sure how to handle this, logging for now, should probably emit to an eventbus
          this.console.color('red').log(`✗ retrying to percist process, attempt: ${i+1} of ${maxAttempts}, reason: ${previousError.message}`)
        }
      }
      finally
      {
        await session.connection.quit()
      }
    }
    while(!committed && i++ < maxAttempts)

    if(committed)
    {
      const 
        ppChannel   = this.mapper.toProcessPersistedChannel(domain, name),
        ppEvent     = this.mapper.toEventProcessPersisted(process)

      await this.redis.stream.write(ppChannel, ppEvent)
      broadcast && this.redisPublisher.pubsub.publish(ppChannel, { pid, name, id, timestamp })
      this.console.color('green').log(id, `✔ ${domain}/${name}`)
    }
    else
    {
      // not sure how to handle this, logging for now, should probably emit to an eventbus
      this.console.color('red').log(id, `✝ ${process.domain}/${process.name} ← could not commit, ${i} attempts`)
    }
  }

  async onProcessError(error)
  {
    const channel = this.mapper.toProcessErrorQueuedChannel()
    await this.redis.stream.write(channel, error)
    await this.redisPublisher.pubsub.publish(channel)
  }

  async onProcessErrorQueued()
  {
    const channel = this.mapper.toProcessErrorQueuedChannel()
    await this.redis.stream.lazyloadConsumerGroup(channel, channel)
    const error = await this.redis.stream.readGroup(channel, channel)

    error && this.console.error(channel, error)
  }

  quit()
  {
    return this.redisPublisher.connection.quit()
  }
}

module.exports = Process

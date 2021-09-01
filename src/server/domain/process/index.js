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
      broadcast = event.broadcast === undefined ? true : false,
      process   = this.mapper.toEntityProcess(event)

    let committed, i = 0
    
    do
    {
      const session = await this.redis.createSession()

      try
      {
        const { timestamp, domain, pid, name, data } = process
        const seKey = this.mapper.toScoredEventKey(domain)
        await session.transaction.watch(seKey)
        const peKey = this.mapper.toProcessEventsKey(domain, pid)
        await session.transaction.watch(peKey)
        const psKey = this.mapper.toProcessStateKey(domain, pid)
        await session.transaction.watch(psKey)
        const phKey = this.mapper.toProcessHistoryKey(domain, pid)
        await session.transaction.watch(phKey)
        const eiKey = this.mapper.toEventIndexKey(domain, name)
        await session.transaction.watch(eiKey)
        await session.transaction.begin()
        const score = this.mapper.toScore(timestamp)
        await session.ordered.write(seKey, score, id)
        await session.hash.write(peKey, name, { id, timestamp })
        await session.list.rpush(phKey, { id, timestamp })
        await session.list.rpush(eiKey, { pid, timestamp })
        const state = await this.redis.key.read(psKey) || {}
        this.deepmerge.merge(state, data)
        await session.key.write(psKey, state)
        const processPersistedChannel = this.mapper.toProcessPersistedChannel(domain, name)
        const processPersistedEvent   = this.mapper.toEventProcessPersisted(process)
        await session.stream.write(processPersistedChannel, processPersistedEvent)
        committed = await session.transaction.commit()
        committed && broadcast && this.redisPublisher.pubsub.publish(processPersistedChannel, { pid, name, id, timestamp })

        this.console.color('green').log(id, `${committed ? '✔' : '✗'} ${domain}/${name}`)
      }
      catch(previousError)
      {
        if(i >= 10)
        {
          throw previousError
        }
        else
        {
          this.console.color('red').log(`✗ retrying to percist process, attempt: ${`${i+1}`.padStart(2)} of 10, reason: ${previousError.message}`)
        }
      }
      finally
      {
        await session.connection.quit()
      }
    }
    while(!committed && i++ < 10)

    if(!committed)
    {
      this.console.color('false').log(id, `✝ ${domain}/${name} ← could not commit, ${i} attempts`)
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

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
    const process = this.mapper.toEntityProcess(event)

    let committed, i = 0
    
    do
    {
      const session = await this.redis.createSession()

      try
      {
        const { domain, pid, name, data } = process
        const peKey = this.mapper.toProcessEventsKey(domain, pid)
        await session.transaction.watch(peKey)
        const psKey = this.mapper.toProcessStateKey(domain, pid)
        await session.transaction.watch(psKey)
        const phKey = this.mapper.toProcessHistoryKey(domain, pid)
        await session.transaction.watch(phKey)
        await session.transaction.begin()
        await session.hash.write(peKey, name, id)
        await session.list.rpush(phKey, id)
        const state = await this.redis.key.read(psKey) || {}
        this.deepmerge.merge(state, data)
        await session.key.write(psKey, state)
        const channel = this.mapper.toProcessPersistedChannel(domain, name)
        const processPersisted = this.mapper.toEventProcessPersisted(process)
        await session.stream.write(channel, processPersisted)
        committed = await session.transaction.commit()
        committed && this.redisPublisher.pubsub.publish(channel)
      }
      catch(previousError)
      {
        if(++i > 10)
        {
          throw previousError
        }
      }
      finally
      {
        await session.quit()
      }
    }
    while(!committed)
  }

  async onProcessError(error)
  {
    const channel = this.mapper.toProcessErrorQueuedChannel()
    await this.redis.stream.write(channel, error)
    await this.redisPublisher.pubsub.publish(channel)
  }

  async onProcessErrorQueued()
  {
    const 
      channel = this.mapper.toProcessErrorQueuedChannel(),
      error   = await this.redis.stream.readGroup(channel, channel)

    error && this.console.error(channel, error)
  }

  quit()
  {
    return this.redisPublisher.quit()
  }
}

module.exports = Process
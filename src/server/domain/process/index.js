/**
 * @memberof Eventsource.Server.Domain
 * @extends {superhero/core/locator/constituent}
 */
class Process
{
  constructor(redis, publisher, mapper, deepmerge, console)
  {
    this.redis          = redis
    this.redisPublisher = publisher
    this.mapper         = mapper
    this.deepmerge      = deepmerge
    this.console        = console
  }

  async onProcessStateQueued()
  {
    if(!this._processingEventQueue)
    {
      this._processingEventQueue = true
      try
      {
        const channel = 'process-state-queued'
        while(await this.redis.stream.read(channel, channel, this.persistProcessState.bind(this)));
      }
      catch(error)
      {
        const channel = 'process-state-queue-error'
        await this.redis.stream.write(channel, error)
        await this.redisPublisher.pubsub.publish(channel)
      }
      finally
      {
        delete this._processingEventQueue
      }
    }
  }

  /**
   * @param {Eventsource.Schema.EntityProcessState} event 
   */
  async persistProcessState(event)
  {
    const processState = this.mapper.toEntityProcessState(event)
    let committed, i = 0
    do
    {
      const session = await this.redis.createSession()

      try
      {
        const { domain, pid, data } = processState
        const psKey = this.mapper.toProcessStateKey(domain, pid)
        await session.transaction.watch(psKey)
        await session.transaction.begin()
        const state = await this.redis.key.read(psKey) || {}
        this.deepmerge.merge(state, data)
        await session.key.write(psKey, state)
        const persitedChannel = 'process-state-persisted'
        await session.stream.write(persitedChannel, processState)
        const processStatePersisted = this.mapper.toEventProcessStatePersisted(processState)
        committed = await session.transaction.commit()
        this.redisPublisher.pubsub.publish(persitedChannel, processStatePersisted)
      }
      catch(error)
      {
        if(++i > 10)
        {
          throw error
        }
      }
      finally
      {
        await session.quit()
      }
    }
    while(!committed)
  }

  async onProcessStatePersisted()
  {
    const 
      channel       = 'process-state-persisted',
      processState  = await this.redis.stream.read(channel, channel)
    
    processState && this.console.color('green').log('process state persisted', processState)
  }

  async onProcessStateQueueError()
  {
    const 
      channel = 'process-state-queue-error',
      error   = await this.redis.stream.read(channel, channel)

    error && this.console.error('process state queue error', error)
  }

  quit()
  {
    return this.redisPublisher.quit()
  }
}

module.exports = Process

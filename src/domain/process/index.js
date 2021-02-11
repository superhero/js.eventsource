/**
 * @memberof Eventsource.Domain
 * @extends {superhero/core/locator/constituent}
 */
class Process
{
  constructor(redis, deepmerge, console)
  {
    this.redis      = redis
    this.deepmerge  = deepmerge
    this.console    = console
  }

  async onProcessEventQueued(channel)
  {
    if(!this._processingEventQueue)
    {
      this._processingEventQueue = true
      try
      {
        await this.redis.stream.read(channel, this.persistProcessState.bind(this, event))
        
      }
      catch(error)
      {
        switch(error.code)
        {
          case 'E_REDIS_STREAM_READ_GATEWAY':
          case 'E_REDIS_STREAM_READ_NULL':
          case 'E_REDIS_STREAM_READ_CONSUMER':
        }
      }
      finally
      {
        delete this._processingEventQueue
      }
    }
  }

  persistProcessState(event)
  {
    const state = await this.redis.hash.read(event.domain, event.pid)
    this.deepmerge.merge(state, event.data)
    await this.redis.hash.write(event.domain, event.pid, state)
    const { domain, pid } = event
    await this.redis.publisher.publish('process state updated', { domain, pid })
  }

  onProcessStatePersisted()
  {
    this.console.color('green').log('process state persisted')
  }
}

module.exports = Process

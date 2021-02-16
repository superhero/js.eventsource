/**
 * @memberof Eventsource.Server.Domain
 * @extends {superhero/core/locator/constituent}
 */
class Process
{
  constructor(redis, mapper, deepmerge, console)
  {
    this.redis      = redis
    this.mapper     = mapper
    this.deepmerge  = deepmerge
    this.console    = console
  }

  async onProcessEventQueued()
  {
    if(!this._processingEventQueue)
    {
      this._processingEventQueue = true
      try
      {
        while(await this.redis.stream.read('process-event-queued', this.persistProcessState.bind(this)));
      }
      catch(error)
      {
        await this.redis.stream.write('process-state-queue-error', error)
        await this.redis.publisher.publish('process-state-queue-error')
      }
      finally
      {
        delete this._processingEventQueue
      }
    }
  }

  async persistProcessState(msg)
  {
    let committed, i = 0
    do
    {
      const
        session = await this.redis.createSession(),
        event   = this.mapper.toEvent(msg)

      try
      {
        const { domain, pid } = event
        const psKey = `ps.${domain}.${pid}`
        await session.transaction.watch(psKey)
        await session.transaction.begin()
        const state = await session.key.read(psKey) || {}
        this.deepmerge.merge(state, event.data)
        await session.key.write(psKey, state)
        committed = await session.transaction.commit()
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
    await this.redis.publisher.publish('process-state-persisted', { domain, pid })
  }

  onProcessStatePersisted()
  {
    this.console.color('green').log('process state persisted')
  }

  onProcessStateQueueError()
  {
    this.console.color('red').log('process state queue error')
  }
}

module.exports = Process

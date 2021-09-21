/**
 * @memberof Eventsource.Server.Domain
 * @extends {superhero/core/locator/constituent}
 */
class Process
{
  constructor(redis, publisher, mapper, eventbus, console)
  {
    this.redis          = redis
    this.redisPublisher = publisher
    this.mapper         = mapper
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
      broadcast   = event.broadcast === undefined ? true : !!event.broadcast,
      process     = this.mapper.toEntityProcess(event),
      { timestamp, domain, pid, name } = process,
      phKey       = this.mapper.toProcessHistoryKey(domain, pid),
      score       = this.mapper.toScore(timestamp)

    try
    {
      await this.redis.ordered.write(phKey, id, score)
    }
    catch(previousError)
    {
      const error = new Error(`${domain}/${name}/${pid} could not be persisted`)
      error.code  = 'E_EVENTSOURCE_PERSIST_PROCESS'
      error.chain = { previousError, id, event }
      throw error
    }

    const ppChannel = this.mapper.toProcessPersistedChannel(domain, name)
    await this.redis.stream.write(ppChannel, { id })
    broadcast && this.redisPublisher.pubsub.publish(ppChannel, process)
    this.console.color('green').log(id, `✔ ${pid} → ${domain}/${name}`)
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

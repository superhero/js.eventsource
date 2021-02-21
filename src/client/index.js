/**
 * @memberof Eventsource.Client
 */
class EventsourceClient
{
  constructor(mapper, redis, publisher)
  {
    this.mapper         = mapper
    this.redis          = redis
    this.redisPublisher = publisher
  }

  /**
   * @param {Eventsource.Schema.EntityProcess} input 
   */
  async write(input)
  {
    try
    {
      const
        channel   = 'process-event-queued',
        process   = this.mapper.toEntityProcess(input),
        response  = await this.redis.stream.write(channel, process)

      this.redisPublisher.pubsub.publish(channel)

      return response
    }
    catch(previousError)
    {
      const error = new Error('problem when writing the process event to the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_WRITE'
      error.chain = { previousError, input }
      throw error
    }
  }

  async readState(domain, pid)
  {
    try
    {
      const 
        psKey     = this.mapper.toProcessStateKey(domain, pid),
        response  = await this.redis.key.read(psKey)

      return response
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the process state from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_STATE'
      error.chain = { previousError, domain, pid }
      throw error
    }
  }

  async readEvents(domain, pid)
  {
    try
    {
      const
        peKey     = this.mapper.toProcessEventsKey(domain, pid),
        response  = await this.redis.hash.read(peKey)

      return response
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the process events from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENTS'
      error.chain = { previousError, domain, pid }
      throw error
    }
  }

  quit()
  {
    return this.redisPublisher.quit()
  }
}

module.exports = EventsourceClient

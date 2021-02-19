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
   * @param {Eventsource.Schema.EntityProcessState} input 
   */
  async write(input)
  {
    try
    {
      const
        channel       = 'process-state-queued',
        processState  = this.mapper.toEntityProcessState(input),
        response      = await this.redis.stream.write(channel, processState)

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

  async read(domain, pid)
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
      error.code  = 'E_EVENTSOURCE_CLIENT_READ'
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

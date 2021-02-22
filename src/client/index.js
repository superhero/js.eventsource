/**
 * @memberof Eventsource.Client
 */
class EventsourceClient
{
  constructor(mapper, redis, publisher, subscriber, eventbus)
  {
    this.mapper           = mapper
    this.redis            = redis
    this.redisPublisher   = publisher
    this.redisSubscriber  = subscriber
    this.eventbus         = eventbus
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

  /**
   * TODO: the content of each event is a refference to the last event, it should 
   * instead be an array pointing to each time the event was persisted
   * 
   * @param {string} domain
   * @param {string} pid
   */
  async readEventlog(domain, pid)
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

  async on(domain, name, consumer)
  {
    const channel = this.mapper.toProcessPersistedChannel(domain, name)
    await this.redis.stream.lazyloadConsumerGroup(channel, channel)
    let processing = false
    this.redisSubscriber.pubsub.subscribe(channel, async () =>
    {
      if(!processing)
      {
        processing = true

        try
        {
          while(await this.redis.stream.read(channel, channel, async (_, event) => 
          {
            const processPersisted = this.mapper.toEventProcessPersisted(event)
            await consumer(processPersisted)
          }));
        }
        catch(previousError)
        {
          const error = new Error('eventsource consumer failed')
          error.code  = 'E_EVENTSOURCE_PROCESS_CONSUMER'
          error.chain = { previousError, domain, name }

          this.eventbus.emit('process-consumer-error', error)
        }
        finally
        {
          processing = false
        }
      }
    })
  }

  async onProcessConsumerError(error)
  {
    const
      { domain, name } = error.chain,
      channel = this.mapper.toProcessConsumerErrorChannel(domain, name)

    await this.redis.stream.write(channel, error)
    await this.redisPublisher.pubsub.publish(channel)
  }

  async quit()
  {
    await this.redisPublisher.quit()
    await this.redisSubscriber.quit()
  }
}

module.exports = EventsourceClient

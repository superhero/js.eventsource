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
        channel   = this.mapper.toProcessEventQueuedChannel(),
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
   * @param {string} domain
   * @param {string} pid
   */
  async readEventlog(domain, pid)
  {
    try
    {
      const
        phKey     = this.mapper.toProcessHistoryKey(domain, pid),
        channel   = this.mapper.toProcessEventQueuedChannel(),
        response  = await this.redis.list.range(phKey, 0, 0)

      for(let i = 0; i < response.length; i++)
      {
        const id = response[i]
        response[i] = await this.redis.stream.read(channel, id)
      }

      return response
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the process eventlog from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENTLOG'
      error.chain = { previousError, domain, pid }
      throw error
    }
  }

  /**
   * @param {string} domain
   * @param {string} pid
   * @param {string} name
   */
  async readEvent(domain, pid, name)
  {
    try
    {
      const 
        peKey     = this.mapper.toProcessEventsKey(domain, pid),
        channel   = this.mapper.toProcessEventQueuedChannel(),
        id        = await this.redis.hash.read(peKey, name),
        response  = await this.redis.stream.read(channel, id)

      return response && response.data
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
   * 
   * @param {string} domain 
   * @param {string} pid 
   * @param {string} name 
   */
  async hasEvent(domain, pid, name)
  {
    try
    {
      const 
        peKey = this.mapper.toProcessEventsKey(domain, pid),
        id    = await this.redis.hash.read(peKey, name)

      return !!id
    }
    catch(previousError)
    {
      const error = new Error('problem when reading if the event exists in the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_HAS_EVENT'
      error.chain = { previousError, domain, pid }
      throw error
    }
  }

  /**
   * @param {string} domain
   * @param {string} pid
   * @param {string} name
   * @param {function} actor
   */
  async lazyload(domain, pid, name, actor)
  {
    try
    {
      const hasEvent = await this.hasEvent(domain, pid, name)

      if(hasEvent)
      {
        return await this.readEvent(domain, pid, name)
      }
    }
    catch(previousError)
    {
      const error = new Error('could not lazyload the former event')
      error.code  = 'E_EVENTSOURCE_CLIENT_LAZYLOAD'
      error.chain = { previousError, domain, pid, name }
      throw error
    }

    let data

    try
    {
      data = await actor()
    }
    catch(previousError)
    {
      const error = new Error('could not lazyload from the supplied actor')
      error.code  = 'E_EVENTSOURCE_CLIENT_LAZYLOAD'
      error.chain = { previousError, domain, pid, name }
      throw error
    }

    try
    {
      await this.write({ domain, pid, name, data })
    }
    catch(previousError)
    {
      const error = new Error('could not persist the actors response')
      error.code  = 'E_EVENTSOURCE_CLIENT_LAZYLOAD'
      error.chain = { previousError, domain, pid, name, data }
      throw error
    }

    return data
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
          while(await this.redis.stream.readGroup(channel, channel, async (_, event) => 
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
    await this.redisPublisher.connection.quit()
    await this.redisSubscriber.connection.quit()
  }
}

module.exports = EventsourceClient

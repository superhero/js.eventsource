/**
 * @memberof Eventsource.Client
 */
class EventsourceClient
{
  constructor(mapper, redis, publisher, subscriber, deepmerge, eventbus, console)
  {
    this.mapper           = mapper
    this.redis            = redis
    this.redisPublisher   = publisher
    this.redisSubscriber  = subscriber
    this.deepmerge        = deepmerge
    this.eventbus         = eventbus
    this.console          = console
  }

  /**
   * @param {Eventsource.Schema.EntityProcess} input 
   * @param {boolean} [broadcast=true] 
   */
  async write(input, broadcast=true)
  {
    try
    {
      const
        channel   = this.mapper.toProcessEventQueuedChannel(),
        process   = this.mapper.toEntityProcess(input),
        response  = await this.redis.stream.write(channel, { ...process, broadcast })

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
        history   = await this.redis.ordered.read(phKey),
        channel   = this.mapper.toProcessEventQueuedChannel(),
        eventlog  = await Promise.all(history.map((id) => this.redis.stream.read(channel, id))),
        filtered  = eventlog.map(this.mapper.toEntityProcess.bind(this.mapper))

      return filtered
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the process eventlog from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENTLOG'
      error.chain = { previousError, domain, pid }
      throw error
    }
  }

  async readState(domain, pid)
  {
    try
    {
      const
        eventlog  = await this.readEventlog(domain, pid),
        state     = this.deepmerge.merge({}, ...eventlog.map((event) => event.data))

      return state
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
   * @param {string} name
   * @param {string} [timestamp] optional, will pop the last event persisted if emitted
   */
  async readEvent(domain, pid, name, timestamp)
  {
    try
    {
      const
        eventlog  = await this.readEventlog(domain, pid),
        filtered  = timestamp
                    ? eventlog.filter((event) => event.name === name && event.timestamp === timestamp)
                    : eventlog.filter((event) => event.name === name)

      return filtered.pop().data
    }
    catch(previousError)
    {
      if(previousError instanceof TypeError)
      {
        const error = new Error('could not find the event in the eventlog')
        error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENT_NOT_FOUND'
        error.chain = { previousError, domain, pid, name, timestamp }
        throw error
      }
      else
      {
        const error = new Error('problem when reading the event from the eventsource')
        error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENT'
        error.chain = { previousError, domain, pid, name, timestamp }
        throw error
      }
    }
  }

  /**
   * @param {number} id
   */
  async readEventById(id)
  {
    try
    {
      const 
        channel   = this.mapper.toProcessEventQueuedChannel(),
        response  = await this.redis.stream.read(channel, id)

      return response
    }
    catch(previousError)
    {
      const error = new Error('problem when reading an event by queue id from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_STATE_BY_ID'
      error.chain = { previousError, id }
      throw error
    }
  }

  /**
   * @param {string} domain 
   * @param {string} pid 
   * @param {string} name 
   */
  async hasEvent(domain, pid, name)
  {
    try
    {
      await this.readEvent(domain, pid, name)
      return true
    }
    catch(previousError)
    {
      if(previousError.code === 'E_EVENTSOURCE_CLIENT_READ_EVENT_NOT_FOUND')
      {
        return false
      }
      else
      {
        const error = new Error('problem when reading if the event exists in the eventsource')
        error.code  = 'E_EVENTSOURCE_CLIENT_HAS_EVENT'
        error.chain = { previousError, domain, pid, name }
        throw error
      }
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

    if(actor)
    {
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

  async subscribe(domain, name, observer)
  {
    const 
      channel       = this.mapper.toProcessPersistedChannel(domain, name),
      subscriberId  = await this.redisSubscriber.pubsub.subscribe(channel, async (...args) =>
      {
        try
        {
          await observer(...args)
        }
        catch(previousError)
        {
          const error = new Error('eventsource observer failed')
          error.code  = 'E_EVENTSOURCE_PROCESS_OBSERVER'
          error.chain = { previousError, domain, name }

          this.eventbus.emit('process-observer-error', error)
        }
      })

    return subscriberId
  }

  async unsubscribe(domain, name, subscriberId)
  {
    const channel = this.mapper.toProcessPersistedChannel(domain, name)
    this.redisSubscriber.pubsub.unsubscribe(channel, subscriberId)
  }

  async unsubscribeAll(domain, name)
  {
    const channel = this.mapper.toProcessPersistedChannel(domain, name)
    this.redisSubscriber.pubsub.unsubscribeAll(channel)
  }

  fetchSubscriberIds(domain, name)
  {
    const channel = this.mapper.toProcessPersistedChannel(domain, name)
    return channel in this.redisSubscriber.pubsub.subscribers
    ? Object.keys(this.redisSubscriber.pubsub.subscribers[channel]).map((n) => parseInt(n))
    : []
  }

  /**
   * @param {string} domain 
   * @param {string} name 
   * @param {function} consumer 
   * 
   * @returns {number} the `subscriberId` is used as a `consumerId` 
   */
  async consume(domain, name, consumer)
  {
    const channel = this.mapper.toProcessPersistedChannel(domain, name)
    await this.redis.stream.lazyloadConsumerGroup(channel, channel)
    let processing = false
    const consumerId = await this.redisSubscriber.pubsub.subscribe(channel, async () =>
    {
      if(!processing)
      {
        processing = true
        try
        {
          while(await this.redis.stream.readGroup(channel, channel, async (_, dto) =>
          {
            const
              channel = this.mapper.toProcessEventQueuedChannel(),
              event   = await this.redis.stream.read(channel, dto.id)

            await consumer(event, consumerId)
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

    return consumerId
  }

  unconsume(domain, name, consumerId)
  {
    return this.unsubscribe(domain, name, consumerId)
  }

  unconsumeAll(domain, name)
  {
    return this.unsubscribeAll(domain, name)
  }

  fetchConsumerIds(domain, name)
  {
    return this.fetchSubscriberIds(domain, name)
  }

  onProcessConsumerError(error)
  {
    return this.onError(error)
  }

  onProcessObserverError(error)
  {
    return this.onError(error)
  }

  async onError(error)
  {
    const
      domain  = error.chain.domain,
      channel = this.mapper.toProcessConsumerErrorChannel(domain)

    this.console.color('red').log(`✗ ${channel} -> ${error.chain.name} -> ${error.message}`)
    this.console.color('red').log(error)

    await this.redis.stream.write(channel, error)
    await this.redisPublisher.pubsub.publish(channel)
  }

  async quit()
  {
    await this.redis.connection.quit()
    await this.redisPublisher.connection.quit()
    await this.redisSubscriber.connection.quit()
  }
}

module.exports = EventsourceClient

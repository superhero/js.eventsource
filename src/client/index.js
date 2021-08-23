/**
 * @memberof Eventsource.Client
 */
class EventsourceClient
{
  constructor(mapper, redis, publisher, subscriber, eventbus, console)
  {
    this.mapper           = mapper
    this.redis            = redis
    this.redisPublisher   = publisher
    this.redisSubscriber  = subscriber
    this.eventbus         = eventbus
    this.console          = console
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
        const { id } = response[i]
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
   * TODO: if event does not exist, then trow an error that describes the issue better then currently:
   * * Error: problem when reading the event from the eventsource
   * * previousError: TypeError: Cannot destructure property `id` of 'undefined' or 'null'
   * 
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
        { id }    = await this.redis.hash.read(peKey, name),
        response  = await this.redis.stream.read(channel, id)

      return response && response.data
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the event from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENT'
      error.chain = { previousError, domain, pid, name }
      throw error
    }
  }

  /**
   * !!! TODO... wtf..? does this return a list of events, if so rename to plural name: "readEventsById"
   * @param {number} id
   */
  async readEventById(id)
  {
    try
    {
      const 
        channel   = this.mapper.toProcessEventQueuedChannel(),
        response  = await this.redis.stream.read(channel, id)

      return response && response.data
    }
    catch(previousError)
    {
      const error = new Error('problem when reading an event by queue id from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_STATE_BY_ID'
      error.chain = { previousError, channel, id }
      throw error
    }
  }

  /**
   * @param {string} domain
   * @param {string} from timestamp
   * @param {string} to timestamp
   */
  async readEventByTimeRange(domain, from, to)
  {
    try
    {
      const
        key       = this.mapper.toScoredEventKey(domain),
        min       = this.mapper.toScore(from),
        max       = this.mapper.toScore(to),
        response  = await this.redis.ordered.read(key, min, max)

      return response && response.data
    }
    catch(previousError)
    {
      const error = new Error('problem when reading events by timerange from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENT_BY_TIME_RANGE'
      error.chain = { previousError, domain, from, to }
      throw error
    }
  }

  /**
   * @param {string} domain
   * @param {string} name
   */
  async readEventIndex(domain, name, start = 0, stop = 0)
  {
    try
    {
      const 
        eiKey   = this.mapper.toEventIndexKey(domain, name),
        pidList = await this.redis.list.range(eiKey, start, stop)

      return pidList
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the event name index from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENT_NAME_INDEX'
      error.chain = { previousError, domain, name }
      throw error
    }
  }

  /**
   * @param {string} domain
   * @param {string} name
   */
  async readEventIndexLength(domain, name)
  {
    try
    {
      const 
        eiKey   = this.mapper.toEventIndexKey(domain, name),
        length  = await this.redis.list.length(eiKey)

      return length
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the event name index length from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENT_NAME_INDEX_LENGTH'
      error.chain = { previousError, domain, name }
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
    let processing = false
    const consumerId = await this.redisSubscriber.pubsub.subscribe(channel, async () =>
    {
      if(!processing)
      {
        processing = true

        try
        {
          await this.redis.stream.lazyloadConsumerGroup(channel, channel)
          while(await this.redis.stream.readGroup(channel, channel, async (_, event) => 
          {
            const processPersisted = this.mapper.toEventProcessPersisted(event)
            await consumer(processPersisted, consumerId)
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
    await this.redisPublisher.connection.quit()
    await this.redisSubscriber.connection.quit()
  }
}

module.exports = EventsourceClient

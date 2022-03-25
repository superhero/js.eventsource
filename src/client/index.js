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

  async bootstrap()
  {
    await this.redisPublisher.connection.connect()
    await this.redisSubscriber.connection.connect()
    
    this.console.color('cyan').log('✔ eventsource client connected "pubsub" sockets')
  }

  async quit()
  {
    await this.redis.connection.quit()
    await this.redisPublisher.connection.quit()
    await this.redisSubscriber.connection.quit()
    
    this.console.color('cyan').log('✔ eventsource client closed all sockets')
  }

  async auth(...args)
  {
    await Promise.all(
    [
      this.redis.gateway.cmd('AUTH', ...args),
      this.redisPublisher.gateway.cmd('AUTH', ...args),
      this.redisSubscriber.gateway.cmd('AUTH', ...args)
    ])

    this.console.color('cyan').log('✔ eventsource client authenticated all sockets')
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
        process   = this.mapper.toEntityProcess(input)

      await this.redis.stream.lazyloadConsumerGroup(channel, channel)
      const response = await this.redis.stream.write(channel, { ...process, broadcast })

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
   * @param {string|number} timestamp value representing the time when the event should be persisted
   * @param {Eventsource.Schema.EntityProcess} input 
   */
  async schedule(timestamp, input)
  {
    try
    {
      const 
        scheduledKey    = this.mapper.toProcessEventScheduledKey(),
        scheduledScore  = new Date(timestamp).getTime(),
        process         = this.mapper.toEntityProcess(input)

      await this.redis.ordered.write(scheduledKey, process, scheduledScore)
      this.redisPublisher.pubsub.publish(scheduledKey, scheduledScore)
    }
    catch(previousError)
    {
      const error = new Error('problem when writing the process event to the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_SCHEDULE'
      error.chain = { previousError, timestamp, input }
      throw error
    }
  }

  /**
   * @param {string} domain
   * @param {string} pid process id
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventlog(domain, pid, from, to, immutable)
  {
    try
    {
      const
        phKey     = this.mapper.toProcessHistoryKey(domain, pid),
        scoreFrom = from  && this.mapper.toScore(from),
        scoreTo   = to    && this.mapper.toScore(to),
        history   = await this.redis.ordered.read(phKey, scoreFrom, scoreTo),
        channel   = this.mapper.toProcessEventQueuedChannel(),
        eventlog  = await Promise.all(history.map((id) => this.redis.stream.read(channel, id))),
        filtered  = eventlog.map((event) => this.mapper.toEntityProcess(event, immutable))

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

  async readState(domain, pid, from=null, to=null, immutable=false)
  {
    try
    {
      const
        eventlog  = await this.readEventlog(domain, pid, from, to, immutable),
        state     = this.deepmerge.merge(...eventlog.map((event) => event.data))

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
    const channel = this.mapper.toProcessPersistedChannel(domain, name)

    await this.redisSubscriber.pubsub.subscribe(channel, async (dto) =>
    {
      try
      {
        const event = await this.readEventById(dto.id)
        await observer(event, dto.id)
      }
      catch(previousError)
      {
        const error = new Error('eventsource observer failed')
        error.code  = 'E_EVENTSOURCE_PROCESS_OBSERVER'
        error.chain = { previousError, domain, name, dto }

        this.eventbus.emit('process-observer-error', error)
      }
    })
  }

  async unsubscribe(domain, name)
  {
    const channel = this.mapper.toProcessPersistedChannel(domain, name)
    this.redisSubscriber.pubsub.unsubscribe(channel)
  }

  async subscribeByPid(domain, pid, observer)
  {
    const channel = this.mapper.toProcessPersistedPidChannel(domain, pid)

    await this.redisSubscriber.pubsub.subscribe(channel, async (dto) =>
    {
      try
      {
        const event = await this.readEventById(dto.id)
        await observer(event, dto.id)
      }
      catch(previousError)
      {
        const error = new Error('eventsource observer by pid failed')
        error.code  = 'E_EVENTSOURCE_PROCESS_PID_OBSERVER'
        error.chain = { previousError, domain, pid, dto }

        this.eventbus.emit('process-observer-pid-error', error)
      }
    })
  }

  async unsubscribeByPid(domain, pid)
  {
    const channel = this.mapper.toProcessPersistedPidChannel(domain, pid)
    this.redisSubscriber.pubsub.unsubscribe(channel)
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
    const subChannel = this.mapper.toProcessPersistedChannel(domain, name)
    let processing = false
    await this.redisSubscriber.pubsub.subscribe(subChannel, async (subDto, _, rgChannel) =>
    {
      if(!processing)
      {
        processing = true
        try
        {
          while(await this.redis.stream.readGroup(rgChannel, rgChannel, async (_, rgDto) =>
          {
            const event = await this.readEventById(rgDto.id)
            await consumer(event, rgDto.id)
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
}

module.exports = EventsourceClient

/**
 * @memberof Eventsource.Client
 */
class EventsourceClient
{
  constructor(mapper, redis, publisher, subscriber, reader, writer, eventbus, console)
  {
    this.mapper           = mapper
    this.redis            = redis
    this.redisPublisher   = publisher
    this.redisSubscriber  = subscriber
    this.reader           = reader
    this.writer           = writer
    this.eventbus         = eventbus
    this.console          = console
  }

  async bootstrap()
  {
    await this.redis.connection.connect()
    this.console.color('green').log('✔ eventsource redis client socket connected')

    await this.redisPublisher.connection.connect()
    this.console.color('green').log('✔ eventsource redis publisher socket connected')

    await this.redisSubscriber.connection.connect()
    this.console.color('green').log('✔ eventsource redis subscriber socket connected')

    await this.redis.bootstrap()
    this.console.color('green').log('✔ eventsource redis bootstrapped')

    await this.redisPublisher.bootstrap()
    this.console.color('green').log('✔ eventsource redis publisher bootstrapped')

    await this.redisSubscriber.bootstrap()
    this.console.color('green').log('✔ eventsource redis subscriber bootstrapped')
  }

  async quit()
  {
    await this.redis.connection.quit()
    await this.redisPublisher.connection.quit()
    await this.redisSubscriber.connection.quit()
    
    this.console.color('green').log('✔ eventsource client closed all sockets')
  }

  /**
   * @param {string} id
   */
  async delete(id)
  {
    try
    {
      return await this.writer.deleteIndexedProcess(id)
    }
    catch(previousError)
    {
      const error = new Error('could not read the event by id from redis')
      error.code  = 'E_EVENTSOURCE_CLIENT_DELETE'
      error.chain = { previousError, id }
      throw error
    }
  }

  /**
   * @param {string} domain 
   * @param {string} pid 
   * @param {string} happyPaths string or array of event names that should be acceptable
   * @param {string} [exceptions] string or array of event names that shoudl be rejected as an exception/error
   * @param {number} [timeout=6e4] 
   * @throws E_EVENTSOURCE_CLIENT_WAIT
   */
  async wait(domain, pid, happyPaths, exceptions, timeout)
  {
    try
    {
      if(false === Array.isArray(happyPaths))
      {
        happyPaths = [happyPaths]
      }
      if(false === Array.isArray(exceptions))
      {
        exceptions = [exceptions]
      }
  
      return new Promise((accept, reject) =>
      {
        const 
          eventNames = [ ...happyPaths, ...exceptions ],
          timeout_id = setTimeout(() => 
          {
            const error = new Error('exceptional event triggered')
            error.code  = 'E_EVENTSOURCE_READER_WAIT_TIMEOUT'
            error.chain = { domain, pid, happyPaths, exceptions, timeout }
            reject(error)
          }, timeout)
  
        for(const name of eventNames)
        {
          const channel = this.mapper.toProcessPersistedPidNameChannel(domain, pid, name)
          this.redisSubscriber.pubsub.subscribe(channel, async (dto) =>
          {
            for(const name of eventNames)
            {
              try
              {
                const channel = this.mapper.toProcessPersistedPidNameChannel(domain, pid, name)
                await this.redisSubscriber.pubsub.unsubscribe(channel)
              }
              catch(previousError)
              {
                clearTimeout(timeout_id)
                const error = new Error('could not unsubscribe to event')
                error.code  = 'E_EVENTSOURCE_READER_WAIT_EXCEPTION'
                error.chain = { previousError, domain, pid, name, eventNames }
                reject(error)
              }
            }
  
            try
            {
              const event = await this.readEventById(dto.id)
              if(happyPaths.includes(event.name))
              {
                clearTimeout(timeout_id)
                accept(event)
              }
              else
              {
                clearTimeout(timeout_id)
                const error = new Error('exceptional event triggered')
                error.code  = 'E_EVENTSOURCE_READER_WAIT_EXCEPTION'
                error.chain = { event, dto }
                reject(error)
              }
            }
            catch(previousError)
            {
              clearTimeout(timeout_id)
              const error = new Error('could not read the event by id from redis')
              error.code  = 'E_EVENTSOURCE_READER_WAIT'
              error.chain = { previousError, domain, pid, name, dto }
              reject(error)
            }
          })
        }
      })
    }
    catch(previousError)
    {
      const error = new Error('could not read the event by id from redis')
      error.code  = 'E_EVENTSOURCE_CLIENT_WAIT'
      error.chain = { previousError, domain, pid, happyPaths, exceptions, timeout }
      throw error
    }
  }

  /**
   * @param {string} domain
   * @param {string} pid
   * @param {string} name
   * 
   * This functionality only works for data written from version 2.4.0
   */
  async deleteByName(domain, pid, name)
  {
    try
    {
      await this.writer.deleteIndexedProcessByName(domain, pid, name)
    }
    catch(previousError)
    {
      const error = new Error('problem when deleting the process events by name from a pid in the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_DELETE_BY_NAME'
      error.chain = { previousError, domain, pid, name }
      throw error
    }
  }

  /**
   * @param {Eventsource.Schema.EntityProcess} input 
   * @param {Eventsource.Schema.EntityProcess} [chain] the event that preceeded 
   * the event now being written, used to be extended by the input entity and set 
   * the referer id called "rid" in the meta value object, extended by the 
   * process entity.
   * @param {boolean} [broadcast=true]
   */
  async write(input, chain, broadcast)
  {
    try
    {
      return await this.writer.writeEvent(this.redisPublisher, input, chain, broadcast)
    }
    catch(previousError)
    {
      const error = new Error('problem when writing the process event to the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_WRITE'
      error.chain = { previousError, input, chain, broadcast }
      throw error
    }
  }

  /**
   * @param {string|number} timestamp value representing the time when the event should be persisted
   * @param {Eventsource.Schema.EntityProcess} input 
   * @param {Eventsource.Schema.EntityProcess} [chain] the event that preceeded 
   * the event now being written, used to be extended by the input entity and set 
   * the referer id called "rid" in the meta value object, extended by the 
   * process entity.
   */
  async schedule(timestamp, input, chain)
  {
    try
    {
      await this.writer.schedule(this.redisPublisher, timestamp, input, chain)
    }
    catch(previousError)
    {
      const error = new Error('problem when writing the process event to the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_SCHEDULE'
      error.chain = { previousError, timestamp, input }
      throw error
    }
  }

  async clearSchedule(min, max)
  {
    try
    {
      await this.writer.clearSchedule(this.redisPublisher, min, max)
    }
    catch(previousError)
    {
      const error = new Error('problem when clearing schedule in the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_CLEAR_SCHEDULE'
      error.chain = { previousError, min, max }
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
      return await this.reader.readEventlog(domain, pid, from, to, immutable)
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
   * This function requires a migration of old data before 3.0.0 release.
   * 
   * @param {string} pid process id
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventlogByPid(pid, from, to, immutable)
  {
    try
    {
      return await this.reader.readEventlogByPid(pid, from, to, immutable)
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the process eventlog from the eventsource only by pid')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENTLOG'
      error.chain = { previousError, pid }
      throw error
    }
  }

  /**
   * This function requires a migration of old data before 3.4.X release.
   * 
   * @param {string} ppid parent process id
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventlogByPpid(ppid, from, to, immutable)
  {
    try
    {
      return await this.reader.readEventlogByPpid(ppid, from, to, immutable)
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the process eventlog from the eventsource only by ppid')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENTLOG'
      error.chain = { previousError, pid }
      throw error
    }
  }

  /**
   * This function requires a migration of old data before 3.4.X release.
   * 
   * @param {string} domain process name
   * @param {string} ppid parent process id
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventlogByDomainAndPpid(domain, ppid, from, to, immutable)
  {
    try
    {
      return await this.reader.readEventlogByDomainAndPpid(domain, ppid, from, to, immutable)
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the process eventlog from the eventsource by domain and ppid')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENTLOG'
      error.chain = { previousError, pid }
      throw error
    }
  }

  /**
   * This function requires a migration of old data before use. The migration script is 
   * expected to be included in future 3.0.0 release.
   * 
   * @param {string} name name of the event
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventWrittenByAllProcesses(name, from, to, immutable)
  {
    try
    {
      return await this.reader.readEventWrittenByAllProcesses(name, from, to, immutable)
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the events written by all processes from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENTLOG'
      error.chain = { previousError, name }
      throw error
    }
  }

  /**
   * @param {string} domain
   * @param {string} pid process id
   * @param {string} name event name
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventlogByEventName(domain, pid, name, from, to, immutable)
  {
    try
    {
      return await this.reader.readEventlogByEventName(domain, pid, name, from, to, immutable)
    }
    catch(previousError)
    {
      const error = new Error('problem when reading the process eventlog from the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_READ_EVENTLOG'
      error.chain = { previousError, domain, pid }
      throw error
    }
  }

  async readState(domain, pid, from, to, immutable)
  {
    try
    {
      return await this.reader.readState(domain, pid, from, to, immutable)
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
   * @param {string} [timestamp] optional, will pop the last event persisted if omitted
   */
  async readEvent(domain, pid, name, timestamp)
  {
    try
    {
      return await this.reader.readEvent(domain, pid, name, timestamp)
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
      return await this.reader.readEventById(id)
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
      return await this.reader.hasEvent(domain, pid, name)
    }
    catch(previousError)
    {
      const error = new Error('problem when reading if the event exists in the eventsource')
      error.code  = 'E_EVENTSOURCE_CLIENT_HAS_EVENT'
      error.chain = { previousError, domain, pid, name }
      throw error
    }
  }

  /**
   * @param {Eventsource.Schema.EntityProcess} input
   * @param {function} actor
   */
  async lazyload({ rid, domain, pid, ppid, name }, actor)
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
      await this.write({ rid, domain, pid, ppid, name, data })
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
   */
  async consume(domain, name, consumer)
  {
    const subChannel = this.mapper.toProcessPersistedChannel(domain, name)
    await this.redisSubscriber.pubsub.subscribe(subChannel, async (subDto, _, rgChannel) =>
    {
      try
      {
        // need to read from group instead of from the published channel to prevent the message 
        // to be handeled multiple times
        // TODO: delete from stream after message was read and consumed properly, the message is 
        // never used again, for anything...
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

    this.console.color('red').log(`✗ ${channel} → ${error.chain.name} → ${error.message}`)
    this.console.color('red').log(error)

    await this.redis.stream.write(channel, error)
    await this.redisPublisher.pubsub.publish(channel)
  }

  /**
   * To migrate data written by version 2 of this library to version 3.
   * 
   * @param {number} [attempt=1] if you, for what ever reason, need to re-attempt the migration from 
   * start, the attempt argument will be used to compose the read-group used to iterate through 
   * the event stream.
   * @param {Array<number>} [reject] an optional array of id's, if needed to reject migration of
   * one or more id's.
   */
  async migrateEventsourceStreamFromV2ToV3(attempt=1, reject=[])
  {
    const
      stream = this.mapper.toProcessEventQueuedChannel(),
      group  = 'migrate-v2-to-v3-attempt-' + attempt

    await this.redis.stream.lazyloadConsumerGroup(stream, group, 0)

    while(await this.redis.stream.readGroup(stream, group, async (id, dto) =>
    {
      // Possible to reject the migration for specific ID
      // This should never be necessery to use, but for all does reasons that I
      // can not predict I decided to add this very small functionality
      // ...to reject migration for specific ID's
      if(reject.includes(id))
      {
        return
      }

      const event = dto?.pid ? dto : await this.readEventById(id)
      this.console.color('blue').log(`- ${event.pid}`)
      const session = this.redis.createSession()

      try
      {
        const
          process     = this.mapper.toQueryProcess(event),
          { timestamp, domain, pid, name } = process,
          phonKey     = this.mapper.toProcessHistoryKeyIndexedOnlyByName(name),
          phopKey     = this.mapper.toProcessHistoryKeyIndexedOnlyByPid(pid),
          phnKey      = this.mapper.toProcessHistoryKeyIndexedByName(domain, pid, name),
          score       = this.mapper.toScore(timestamp)

        await this.redis.connection.connect()
        await this.redis.auth()
        await this.redis.transaction.begin()

        await this.redis.ordered.has(phnKey, id)
        || await this.redis.ordered.write(phnKey, id, score)

        await this.redis.ordered.has(phonKey, id)
        || await this.redis.ordered.write(phonKey, id, score)

        await this.redis.ordered.has(phopKey, id)
        || await this.redis.ordered.write(phopKey, id, score)

        await this.redis.transaction.commit()

        this.console.color('green').log(`✔ ${pid} → ${domain}/${name} → ${id} → ${timestamp}`)
      }
      catch(previousError)
      {
        const error = new Error(`could not migrate process`)
        error.code  = 'E_EVENTSOURCE_MIGRATE_PROCESS'
        error.chain = { previousError, id, event, attempt }
        throw error
      }
      finally
      {
        await this.redis.connection.quit()
      }
    }));

    this.console.color('blue').log('✔ the migration process has finished')
  }

  /**
   * To migrate data written by version 3 of this library to version 3.4.X.
   * 
   * @param {number} [attempt=1] if you, for what ever reason, need to re-attempt the migration from 
   * start, the attempt argument will be used to compose the read-group used to iterate through 
   * the event stream.
   * @param {Array<number>} [reject] an optional array of id's, if needed to reject migration of
   * one or more id's.
   */
  async migrateEventsourceStreamFromV3ToV3_4(attempt=1, reject=[])
  {
    const
      stream = this.mapper.toProcessEventQueuedChannel(),
      group  = 'migrate-v3-to-v3_4-attempt-' + attempt

    await this.redis.stream.lazyloadConsumerGroup(stream, group, 0)

    while(await this.redis.stream.readGroup(stream, group, async (id, dto) =>
    {
      // Possible to reject the migration for specific ID
      // This should never be necessery to use, but for all does reasons that I
      // can not predict I decided to add this very small functionality
      // ...to reject migration for specific ID's
      if(reject.includes(id))
      {
        return
      }

      const event = dto?.pid ? dto : await this.readEventById(id)
      this.console.color('blue').log(`- ${event.pid}`)
      const session = this.redis.createSession()

      try
      {
        const
          process   = this.mapper.toQueryProcess(event),
          { domain, timestamp, ppid, pid, name } = process,
          phoppKey  = this.mapper.toProcessHistoryKeyIndexedOnlyByPpid(ppid),
          phppKey   = this.mapper.toProcessHistoryKeyIndexedByPpid(domain, ppid),
          score     = this.mapper.toScore(timestamp)

        await session.connection.connect()
        await session.auth()
        await session.transaction.begin()

        await this.redis.ordered.has(phoppKey, id)
        || await session.ordered.write(phoppKey, id, score)

        await this.redis.ordered.has(phppKey, id)
        || await session.ordered.write(phppKey, id, score)

        await session.transaction.commit()

        this.console.color('green').log(`✔ ${pid} → ${domain}/${name} → ${id} → ${timestamp}`)
      }
      catch(previousError)
      {
        const error = new Error(`could not migrate process`)
        error.code  = 'E_EVENTSOURCE_MIGRATE_PROCESS'
        error.chain = { previousError, id, event, attempt }
        throw error
      }
      finally
      {
        await session.connection.quit()
      }
    }));

    this.console.color('blue').log('✔ the migration process has finished')
  }

  /**
   * To migrate data written by version 3.4 of this library to version 3.5.
   * 
   * @param {number} [attempt=1] if you, for what ever reason, need to re-attempt the migration from 
   * start, the attempt argument will be used to compose the read-group used to iterate through 
   * the event stream.
   * @param {Array<number>} [reject] an optional array of id's, if needed to reject migration of
   * one or more id's.
   */
  async migrateEventsourceStreamFromV3_4ToV3_5(attempt=1, reject=[])
  {
    const
      stream = this.mapper.toProcessEventQueuedChannel(),
      group  = 'migrate-v3_4-to-v3_5-attempt-' + attempt

    await this.redis.stream.lazyloadConsumerGroup(stream, group, 0)

    while(await this.redis.stream.readGroup(stream, group, async (id, dto) =>
    {
      // Possible to reject the migration for specific ID
      // This should never be necessery to use, but for all does reasons that I
      // can not predict I decided to add this very small functionality
      // ...to reject migration for specific ID's
      if(reject.includes(id))
      {
        return
      }

      const event = dto?.pid ? dto : await this.readEventById(id)
      this.console.color('blue').log(`- ${event.pid}`)
      const session = this.redis.createSession()

      try
      {
        const
          process = this.mapper.toQueryProcess(event),
          pdKey   = this.mapper.toProcessDataKey(),
          { timestamp, pid, domain, name } = process

        await session.connection.connect()
        await session.auth()
        await session.transaction.begin()

        await this.redis.hash.has(pdKey, id)
        || await session.hash.write(pdKey, id, process)

        await session.transaction.commit()

        this.console.color('green').log(`✔ ${pid} → ${domain}/${name} → ${id} → ${timestamp}`)
      }
      catch(previousError)
      {
        const error = new Error(`could not migrate process`)
        error.code  = 'E_EVENTSOURCE_MIGRATE_PROCESS'
        error.chain = { previousError, id, event, attempt }
        throw error
      }
      finally
      {
        await session.connection.quit()
      }
    }));

    this.console.color('blue').log('✔ the migration process has finished')
  }

  /**
   * To migrate data written by version 3.5 of this library to version 3.6.
   * 
   * @param {number} [attempt=1] if you, for what ever reason, need to re-attempt the migration from 
   * start, the attempt argument will be used to compose the read-group used to iterate through 
   * the event stream.
   * @param {Array<number>} [reject] an optional array of id's, if needed to reject migration of
   * one or more id's.
   */
  async migrateEventsourceStreamFromV3_5ToV3_6(attempt=1, reject=[])
  {
    const
      stream = this.mapper.toProcessEventQueuedChannel(),
      group  = 'migrate-v3_5-to-v3_6-attempt-' + attempt

    await this.redis.stream.lazyloadConsumerGroup(stream, group, 0)

    while(await this.redis.stream.readGroup(stream, group, async (id, dto) =>
    {
      // Possible to reject the migration for specific ID
      // This should never be necessery to use, but for all does reasons that I
      // can not predict I decided to add this very small functionality
      // ...to reject migration for specific ID's
      if(reject.includes(id))
      {
        return
      }

      const event = dto?.pid ? dto : await this.readEventById(id)
      this.console.color('blue').log(`- ${event.pid}`)
      const session = this.redis.createSession()

      try
      {
        const
          process         = this.mapper.toQueryProcess(event),
          pdKey           = this.mapper.toProcessDataKey(),
          queuedChannel   = this.mapper.toProcessEventQueuedChannel(),
          indexedChannel  = this.mapper.toProcessEventIndexedChannel(),
          { timestamp, pid, domain, name } = process

        await session.connection.connect()
        await session.auth()
        await session.transaction.begin()

        if(false === await this.redis.hash.has(pdKey, id))
        {
          const error = new Error('the process data has not been written to the hash index, '
                                + 'deleting it from the stream could lead to permanent loss of data')
          error.code  = 'E_EVENTSOURCE_MIGRATE_PROCESS_MISSING_DATA'
          error.chain = { id, event }
          throw error
        }

        await session.stream.delete(queuedChannel, id)
        await session.stream.write(indexedChannel, { id })

        await session.transaction.commit()

        this.console.color('green').log(`✔ ${pid} → ${domain}/${name} → ${id} → ${timestamp}`)
      }
      catch(previousError)
      {
        const error = new Error(`could not migrate process`)
        error.code  = 'E_EVENTSOURCE_MIGRATE_PROCESS'
        error.chain = { previousError, id, event, attempt }
        throw error
      }
      finally
      {
        await session.connection.quit()
      }
    }));

    this.console.color('blue').log('✔ the migration process has finished')
  }
}

module.exports = EventsourceClient

/**
 * @memberof Eventsource.Server
 * @extends {superhero/core/locator/constituent}
 */
class Process
{
  constructor(redis, publisher, subscriber, mapper, eventbus, console, channels, authKey)
  {
    this.redis            = redis
    this.redisPublisher   = publisher
    this.redisSubscriber  = subscriber
    this.mapper           = mapper
    this.eventbus         = eventbus
    this.console          = console
    this.channels         = channels
    this.authKey          = authKey
  }

  /**
   * Initializes the process by connecting to Redis publisher and subscriber,
   * authenticating if necessary, subscribing to the channels, and bootstrapping
   * the process schedule.
   */
  async bootstrap()
  {
    await this.redisPublisher.connection.connect()
    await this.redisSubscriber.connection.connect()

    this.console.color('cyan').log('✔ eventsource connected "pubsub" sockets')

    // if authentication key is present, authenticate Redis publisher and subscriber
    if(this.authKey)
    {
      await this.redisPublisher.auth()
      await this.redisSubscriber.auth()

      this.console.color('cyan').log('✔ eventsource authenticated all sockets')
    }
    else
    {
      this.console.color('yellow').log('- eventsource has no authentication key configured')
    }

    for(const channel of this.channels)
    {
      await this.redisSubscriber.pubsub.subscribe(channel, (dto) => this.eventbus.emit(channel, dto))
    }

    await this.setClusterKeySlots()

    await this.bootstrapProcessSchedule()
  }

  async setClusterKeySlots()
  {
    const
      scheduledKey  = this.mapper.toProcessEventScheduledKey(),
      queueChannel  = this.mapper.toProcessEventQueuedChannel(),
      slot          = 'super'

    try
    {
      await this.redis.cluster.keySlot(scheduledKey, slot)
      await this.redis.cluster.keySlot(queueChannel, slot)
    }
    catch(error)
    {
      this.console.color('yellow').log('key slot could not be set for cluster:', error.message)
      this.console.color('yellow').log(`key slot could not be set, you are recomended to set them manually if you are in a clustered envirment: ${scheduledKey}, ${queueChannel}`)
      this.console.color('yellow').log('...it is only needed to set the key slot for the cluster once initally, but it is safe to set multiple times')
    }
  }

  /**
   * Initializes the process schedule by reading the minimum scheduled timestamp
   * from Redis and calling the onProcessEventScheduled method with it.
   */
  async bootstrapProcessSchedule()
  {
    const
      scheduledKey  = this.mapper.toProcessEventScheduledKey(),
      minimum       = true,
      timestamp     = await this.redis.ordered.readScore(scheduledKey, minimum)

    timestamp && this.onProcessEventScheduled(timestamp)
  }

  /**
   * Handles the scheduling of a process with the given timestamp.
   * If an earlier task is already scheduled, logs a message and returns.
   * Otherwise, updates the schedule queue and sets a timeout for the process.
   *
   * @param {string|number} timestamp - The timestamp for the scheduled process.
   */
  onProcessEventScheduled(timestamp)
  {
    timestamp = new Date(timestamp).getTime()

    const
      oldTimestamp = new Date(this.timestamp).toJSON(),
      newTimestamp = new Date(timestamp).toJSON()

    if(this.timestamp
    && this.timestamp < timestamp)
    {
      this.console.color('yellow').log(`- an earlier scheduled task is already queued: ${oldTimestamp} compared to new task timestamp: ${newTimestamp}`)
      return
    }

    this.console.color('green').log(`✔ updating schedule queue to ${newTimestamp} from ${oldTimestamp}`)

    this.timestamp = timestamp
    const timeout = Math.max(0, this.timestamp - Date.now())
    clearTimeout(this.timeoutId)
    this.timeoutId = setTimeout(async () =>
    {
      delete this.timestamp
      await this.persistTimedoutScheduledProcesses()
      await this.bootstrapProcessSchedule()
    },
    timeout)
  }

  async onProcessEventScheduledCleared()
  {
    clearTimeout(this.timeoutId)
    await this.bootstrapProcessSchedule()
  }

  async persistTimedoutScheduledProcesses()
  {
    const
      scheduledKey  = this.mapper.toProcessEventScheduledKey(),
      queueChannel  = this.mapper.toProcessEventQueuedChannel(),
      session       = this.redis.createSession()

    try
    {
      await session.connection.connect()
      await session.auth()

      try
      {
        await session.transaction.watch(scheduledKey)
        await session.transaction.begin()
    
        const
          now   = Date.now(),
          list  = await this.redis.ordered.read(scheduledKey, 0, now)
    
        for(const input of list)
        {
          try
          {
            const 
              process   = this.mapper.toQueryProcess(input),
              timestamp = new Date(process.timestamp).toJSON()

            await this.redis.stream.lazyloadConsumerGroup(queueChannel, queueChannel)
            await session.stream.write(queueChannel, process)
            this.console.color('cyan').log(`✔ ${process.pid} → ${process.domain}/${process.name} → scheduled event queued ${timestamp}`)
          }
          catch(error)
          {
            this.eventbus.emit('schedule-error', error)
          }
        }

        await session.ordered.delete(scheduledKey, 0, now)
        await session.transaction.commit()
        await this.redisPublisher.pubsub.publish(queueChannel)
      }
      catch(error)
      {
        this.console.color('red').log(`✗ error → "scheduled event queued" failed when attempting to commit`)
        await session.transaction.roleback()
        this.eventbus.emit('schedule-error', error)
      }
    }
    catch(error)
    {
      this.eventbus.emit('schedule-error', error)
    }
    finally
    {
      await session.connection.quit()
    }
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
        this.console.log(error)
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
      broadcast     = event.broadcast === undefined ? true : !!event.broadcast,
      process       = this.mapper.toQueryProcess(event),
      { timestamp, domain, pid, ppid, name } = process,
      pdKey         = this.mapper.toProcessDataKey(),
      phKey         = this.mapper.toProcessHistoryKey(domain, pid),
      phonKey       = this.mapper.toProcessHistoryKeyIndexedOnlyByName(name),
      phopKey       = this.mapper.toProcessHistoryKeyIndexedOnlyByPid(pid),
      phoppKey      = this.mapper.toProcessHistoryKeyIndexedOnlyByPpid(ppid),
      phppKey       = this.mapper.toProcessHistoryKeyIndexedByPpid(domain, ppid),
      phnKey        = this.mapper.toProcessHistoryKeyIndexedByName(domain, pid, name),
      queuedChannel = this.mapper.toProcessEventQueuedChannel(),
      score         = this.mapper.toScore(timestamp)

    try
    {
      await this.redis.hash.write(pdKey, id, process)
      await this.redis.ordered.write(phKey,   id, score)
      await this.redis.ordered.write(phnKey,  id, score)
      await this.redis.ordered.write(phonKey, id, score)
      await this.redis.ordered.write(phopKey, id, score)

      if(ppid)
      {
        await this.redis.ordered.write(phoppKey, id, score)
        await this.redis.ordered.write(phppKey,  id, score)
      }

      await this.redis.stream.delete(queuedChannel, id)
    }
    catch(previousError)
    {
      const error = new Error(`${domain}/${name}/${pid} could not be persisted`)
      error.code  = 'E_EVENTSOURCE_PERSIST_PROCESS'
      error.chain = { previousError, id, event }
      throw error
    }

    if(broadcast)
    {
      const 
        ppChannel         = this.mapper.toProcessPersistedChannel(domain, name),
        ppPidChannel      = this.mapper.toProcessPersistedPidChannel(domain, pid),
        ppPidNameChannel  = this.mapper.toProcessPersistedPidNameChannel(domain, pid, name)

      await this.redis.stream.lazyloadConsumerGroup(ppChannel, ppChannel)
      await this.redis.stream.write(ppChannel, { id })
      await this.redisPublisher.pubsub.publish(ppChannel,         { id })
      await this.redisPublisher.pubsub.publish(ppPidChannel,      { id })
      await this.redisPublisher.pubsub.publish(ppPidNameChannel,  { id })
    }

    this.console.color('green').log(`✔ ${pid} → ${domain}/${name} → ${id} → broadcasted: ${broadcast ? 'yes' : 'no'}`)
  }

  async onProcessError(error)
  {
    const channel = this.mapper.toProcessErrorQueuedChannel()
    await this.redis.stream.lazyloadConsumerGroup(channel, channel)
    await this.redis.stream.write(channel, error)
    await this.redisPublisher.pubsub.publish(channel)
  }

  async onProcessErrorQueued()
  {
    const channel = this.mapper.toProcessErrorQueuedChannel()
    const error = await this.redis.stream.readGroup(channel, channel)

    error
    ? this.console.error(channel, error)
    : this.console.error(channel, 'error not found')
  }

  async onScheduleError(error)
  {
    const channel = this.mapper.toProcessErrorScheduledChannel()
    await this.redis.stream.lazyloadConsumerGroup(channel, channel)
    await this.redis.stream.write(channel, error)
    await this.redisPublisher.pubsub.publish(channel)
  }

  async onProcessErrorScheduled()
  {
    const channel = this.mapper.toProcessErrorScheduledChannel()
    const error = await this.redis.stream.readGroup(channel, channel)

    error
    ? this.console.error(channel, error)
    : this.console.error(channel, 'error not found')
  }

  async quit()
  {
    await this.redisPublisher.connection.quit()
    await this.redisSubscriber.connection.quit()
  }
}

module.exports = Process

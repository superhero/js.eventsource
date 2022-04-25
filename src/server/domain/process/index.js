/**
 * @memberof Eventsource.Server.Domain
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

  async bootstrap()
  {
    await this.redisPublisher.connection.connect()
    await this.redisSubscriber.connection.connect()

    this.console.color('cyan').log('✔ eventsource connected "pubsub" sockets')

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

    await this.bootstrapProcessSchedule()
  }

  async bootstrapProcessSchedule()
  {
    const
      scheduledKey  = this.mapper.toProcessEventScheduledKey(),
      minimum       = true,
      timestamp     = await this.redis.ordered.readScore(scheduledKey, minimum)

    this.console.log('timestamp', timestamp)

    timestamp && this.onProcessEventScheduled(timestamp)
  }

  onProcessEventScheduled(timestamp)
  {
    const timeout = new Date(timestamp).getTime() - Date.now()
    this.timeout = Math.min(timeout, this.timeout || timeout)
    this.console.log('timeout', timeout)
    clearTimeout(this.timeoutId)
    this.timeoutId = setTimeout(async () =>
    {
      await this.persistTimedoutScheduledProcesses()
      await this.bootstrapProcessSchedule()
    },
    this.timeout)
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
            const process = this.mapper.toEntityProcess(input)
            await this.redis.stream.lazyloadConsumerGroup(queueChannel, queueChannel)
            session.stream.write(queueChannel, process)
            session.pubsub.publish(queueChannel)

            this.console.color('cyan').log(`✔ ${process.pid} → ${process.domain}/${process.name} → scheduled event queued`)
          }
          catch(error)
          {
            this.eventbus.emit('schedule-error', error)
          }
        }
    
        this.console.log('delete scheduledKey', scheduledKey, now)
        await session.ordered.delete(scheduledKey, 0, now)
        await session.transaction.commit()
      }
      catch(error)
      {
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

    if(broadcast)
    {
      const 
        ppChannel     = this.mapper.toProcessPersistedChannel(domain, name),
        ppPidChannel  = this.mapper.toProcessPersistedPidChannel(domain, pid)

      await this.redis.stream.lazyloadConsumerGroup(ppChannel, ppChannel)
      await this.redis.stream.write(ppChannel, { id })
      await this.redisPublisher.pubsub.publish(ppChannel,     { id })
      await this.redisPublisher.pubsub.publish(ppPidChannel,  { id })
    }

    this.console.color('green').log(`✔ ${pid} → ${domain}/${name} → ${id}`)
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

    error && this.console.error(channel, error)
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

    error && this.console.error(channel, error)
  }

  async quit()
  {
    await this.redisPublisher.connection.quit()
    await this.redisSubscriber.connection.quit()
  }
}

module.exports = Process

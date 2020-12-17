/**
 * @memberof Eventsource.Api
 */
class ApiBootstrap
{
  constructor(redis, mysql, composer, eventbus, console)
  {
    this.redis    = redis
    this.mysql    = mysql
    this.composer = composer
    this.eventbus = eventbus
    this.console  = console
  }

  /**
   * setup channel communication between redis clients and mysql on service bootstrap
   */
  bootstrap()
  {
    this.redis.subscribe('fetch')
    this.redis.subscribe('fetch-next')
    this.redis.subscribe('persist')

    this.redis.on('fetch', async (message) =>
    {
      const event = this.composer.compose('eventsource/shema/event/requested-to-fetch', message)

      try
      {
        const stream = await this.mysql.fetchStream(event)

        // listen to the result event to handle all row packages streamed by the mysql connection
        stream.on('result', this.streamOnResult.bind(this, event, stream))
  
        // any error will be handled by resetting
        stream.on('error', this.streamOnError.bind(this, event, stream))
  
        // emit an end message to signal to the client that transmission has completed
        stream.on('end', this.streamOnEnd.bind(this, event))
      }
      catch(error)
      {
        this.onError(event, error)
      }
    })

    this.redis.on('fetch-next', async (message) =>
    {
      // By emitting the message, the message can be picked up by a listener to resume or destroy an already
      // paused mysql activity, based on the message type..

      const event = this.composer.compose('eventsource/shema/event/requested-to-fetch-next', message)
      
      this.eventbus.emit(event.channel)
    })

    this.redis.on('persist', async (message) =>
    {
      const event = this.composer.compose('eventsource/shema/event/requested-to-persist', message)

      try
      {
        const result = await this.mysql.persist(event)
  
        this.redis.publish(event.channel, result)
        this.redis.emitEnd(event.channel)
      }
      catch(error)
      {
        this.onError(event, error)
      }
    })

    return new Promise((accept) =>
    {
      this.redis.gateway.subscriber.on('subscribe', (channel, count) => count === 3 && accept())
    })
  }

  /**
   * @private
   */
  streamOnResult(event, stream, packet, ...rest)
  {
    // pause the mysql connection to prevent a stack overlow when working with large data in multiple services
    // by pausing the connection we ensure that only one row is processed, before the next is processed
    stream._connection.pause()

    // timeout after 5 sec
    const timeoutId = setTimeout(() =>
    {   
      // publish a timeout message to the channel so that the client can take action accordingly
      this.redis.publish(event.channel, 'timeout')

      // destroy the mysql connection to prevent resource allocation
      stream._connection.destroy()

      // removing the listener that listens for incoming messages on the same channel
      this.eventbus.removeAllListeners(event.channel)
    }, 5e3)

    // listen to the channel to see when the client has accepted the published package, and the client is ready
    // to accept a new packet, or if the connection is to be destroyed.
    // attach a listener that only listenes to the next message
    this.eventbus.once(event.channel, (message) =>
    {
      // clear the timeout once we recieve a "pong" message from the client
      clearTimeout(timeoutId)

      if(message === 'end')
      {
        // destroy the mysql stream if the client has requested the transmission  to end prematurely
        stream._connection.destroy()
      }
      else
      {
        // resume the stream if no known exception has been declared by the message body
        stream._connection.resume()
      }
    })

    // broadcast the packet over the defined channel
    this.redis.publish(event.channel, packet)
  }

  /**
   * @private
   */
  onError(event, error)
  {
    // broadcasted an error message over the designated channel for the client to act according to
    this.redis.publish(event.channel, 'error')
    this.redis.emitEnd(event.channel)
  }

  /**
   * @private
   */
  streamOnError(event, stream, error)
  {
    this.onError(event, error)

    // destroy the mysql connection to prevent resource allocation
    stream._connection.destroy()
  }

  /**
   * @private
   */
  streamOnEnd(event)
  {
    this.redis.emitEnd(event.channel)
  }
}

module.exports = ApiBootstrap

/**
 * @memberof Infrastructure
 */
class ApiBootstrap
{
  constructor(redis, mysql, composer, eventbus)
  {
    this.redis    = redis
    this.mysql    = mysql
    this.composer = composer
    this.eventbus = eventbus
  }

  /**
   * setup channel communication between redis clients and mysql on service bootstrap
   */
  bootstrap()
  {
    this.redis.subscribeToRequests()

    this.redis.gateway.on('message', async (channel, message) =>
    {
      // all messages are assumed to be encodee as stringified json objects
      const parsedMessage = JSON.parse(message)

      // route behaviour depending on the channel of the incomming message
      switch(channel)
      {
        case 'fetch':
        {
          const
          event   = this.composer.compose('event/requested-to-fetch', parsedMessage),
          stream  = this.mysql.fetchStream(event)

          // listen to the result event to handle all row packages streamed by the mysql connection
          stream.on('result', this.streamOnResult.bind(this, event, stream))

          // any error will be handled by resetting
          stream.on('error', this.streamOnError.bind(this, event, stream))

          // emit an end message to signal to the client that transmission has completed
          stream.on('end', this.streamOnEnd.bind(this, event))

          break
        }
        case 'persist':
        {
          const
          event   = this.composer.compose('event/requested-to-persist', parsedMessage),
          result  = await this.mysql.persist(event)

          this.redis.publish(event.channel, result)
          this.redis.emitEnd(event.channel)

          break
        }
        default:
        {
          // If the channel is unknown, then it is assumed to be an open channel for a specific stream
          // By emitting the message, the message can be picked up by a listener to resume or destroy an already
          // paused mysql activity, based on the message type..

          this.eventbus.emit(channel, message)
        }
      }
    })
  }

  /**
   * @private
   */
  streamOnResult(event, stream, package)
  {
    // pause the mysql connection to prevent a stack overlow when working with large data in multiple services
    // by pausing the connection we ensure that only one row is processed, before the next is processed
    stream._connection.pause()

    // listen to the channel to see when the client has accepted the published package, and the client is ready
    // to accept a new package, or if the connection is to be destroyed.
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

    // broadcast the package over the defined channel
    this.redis.publish(event.channel, package)
  }

  /**
   * @private
   */
  streamOnError(event, stream, error)
  {
    // broadcasted an error message over the designated channel for the client to act according to
    this.redis.publish(event.channel, 'error')

    // destroy the mysql connection to prevent resource allocation
    stream._connection.destroy()

    // log the error message to be able to know what dafaq went wrong...
    console.log('error', __filename, error)
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

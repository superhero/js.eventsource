/**
 * @memberof Eventsource.Infrastructure
 */
class RedisRepository
{
  constructor(gateway)
  {
    this.gateway    = gateway
    this.listeners  = {}

    this.gateway.onMessage(this.routeMessage.bind(this))
  }

  unsubscribe(channel)
  {
    this.gateway.unsubscribe(channel)
  }

  subscribe(channel)
  {
    this.gateway.subscribe(channel)
  }

  publish(channel, data)
  {
    this.gateway.publish(channel, data)
  }

  /**
   * @private
   */
  routeMessage(channel, message)
  {
    if(channel in this.listeners)
    {
      this.listeners[channel].forEach((listener) => listener(message))

      if(message === 'end')
      {
        delete this.listeners[channel]
      }
    }
    else
    {
      console.log(`message recieved over channel: "${channel}", but no listener exists for that channel, message:`, message)
    }
  }

  on(channel, callback)
  {
    if(!Array.isArray(this.listeners[channel]))
    {
      this.listeners[channel] = []
    }

    this.listeners[channel].push(callback)
  }

  emitEnd(channel)
  {
    this.publish(channel, 'end')
  }
}

module.exports = RedisRepository

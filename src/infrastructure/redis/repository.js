/**
 * @memberof Infrastructure
 */
class RedisRepository
{
  constructor(gateway)
  {
    this.gateway = gateway
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

  subscribeToRequests()
  {
    this.subscribe('fetch')
    this.subscribe('persist')
  }

  emitEnd(channel)
  {
    this.publish(channel, 'end')
  }
}

module.exports = RedisRepository

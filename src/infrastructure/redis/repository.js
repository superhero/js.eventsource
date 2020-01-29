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

  publish(data)
  {
    const stringified = JSON.stringify(data)
    this.gateway.publish(channel, stringified)
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

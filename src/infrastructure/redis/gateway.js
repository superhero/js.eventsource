/**
 * @memberof Infrastructure
 */
class RedisGateway
{
  constructor(publisher, subscriber)
  {
    this.publisher  = publisher
    this.subscriber = subscriber
  }

  subscribe(channel)
  {
    this.subscriber.subscribe(channel)
  }

  unsubscribe(channel)
  {
    this.subscriber.unsubscribe(channel)
  }

  publish(channel, data)
  {
    const stringified = JSON.stringify(data)
    this.publisher.publish(channel, stringified)
  }

  onMessage(callback)
  {
    this.subscriber.on('message', callback)
  }

  close()
  {
    this.subscriber.unsubscribe()
    this.subscriber.quit()
    this.publisher.quit()
  }
}

module.exports = RedisGateway

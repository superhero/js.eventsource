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
    this.subscriber.on('message', (channel, message) =>
    {
      const parsedMessage = JSON.parse(message)
      callback(channel, parsedMessage)
    })
  }

  close()
  {
    this.subscriber.unsubscribe()
    this.subscriber.quit()
    this.publisher.quit()
  }
}

module.exports = RedisGateway

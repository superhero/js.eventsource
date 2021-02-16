/**
 * @memberof Eventsource.Server.Infrastructure
 */
class RedisServicePublisher
{
  constructor(gateway)
  {
    this.gateway = gateway
  }

  publish(channel, msg)
  {
    const encoded = JSON.stringify(msg)
    this.gateway.publish(channel, encoded)
  }
}

module.exports = RedisServicePublisher

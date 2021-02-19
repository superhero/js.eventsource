/**
 * @memberof Eventsource.Server.Api
 */
class RedisSubscriber
{
  constructor(config, redis, subscriber, eventbus)
  {
    this.config           = config
    this.redis            = redis
    this.redisSubscriber  = subscriber
    this.eventbus         = eventbus
  }

  async bootstrap()
  {
    for(const channel of this.config.channels)
    {
      this.redisSubscriber.pubsub.subscribe(channel, (dto) => this.eventbus.emit(channel, dto))
      await this.redis.stream.lazyloadConsumerGroup(channel, channel)
    }
  }

  quit()
  {
    return this.redisSubscriber.quit()
  }
}

module.exports = RedisSubscriber

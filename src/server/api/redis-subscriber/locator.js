const
  RedisSubscriber     = require('.'),
  LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Eventsource.Server.Api
 * @extends {superhero/core/locator/constituent}
 */
class RedisSubscriberLocator extends LocatorConstituent
{
  /**
   * @returns {RedisSubscriber}
   */
  locate()
  {
    const
      redis           = this.locator.locate('redis/client'),
      subscriber      = redis.createSession(),
      eventbus        = this.locator.locate('core/eventbus'),
      configuration   = this.locator.locate('core/configuration'),
      config          = configuration.find('api/redis-subscriber')

    return new RedisSubscriber(config, redis, subscriber, eventbus)
  }
}

module.exports = RedisSubscriberLocator

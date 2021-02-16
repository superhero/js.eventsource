const
  RedisSubscriber     = require('.'),
  redis               = require('redis'),
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
      configuration = this.locator.locate('core/configuration'),
      options       = configuration.find('infrastructure/redis/gateway'),
      client        = redis.createClient(options),
      eventbus      = this.locator.locate('core/eventbus')

    return new RedisSubscriber(client, eventbus)
  }
}

module.exports = RedisSubscriberLocator

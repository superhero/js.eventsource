const
redis               = require('redis'),
RedisGateway        = require('./gateway'),
RedisRepository     = require('./repository'),
LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Infrastructure
 * @extends {superhero/core/locator/constituent}
 */
class RedisRepositoryLocator extends LocatorConstituent
{
  /**
   * @returns {RedisRepository}
   */
  locate()
  {
    const
    configuration = this.locator.locate('core/configuration'),
    options       = configuration.find('infrastructure/redis/gateway'),
    subscriber    = redis.createClient(options),
    publisher     = redis.createClient(options),
    gateway       = new RedisGateway(subscriber, publisher)

    return new RedisRepository(gateway)
  }
}

module.exports = RedisRepositoryLocator

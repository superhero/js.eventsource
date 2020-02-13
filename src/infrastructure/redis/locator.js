const
redis               = require('redis'),
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
    gateway       = redis.createClient(options)

    return new RedisRepository(gateway)
  }
}

module.exports = RedisRepositoryLocator

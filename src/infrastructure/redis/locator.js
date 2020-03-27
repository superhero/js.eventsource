const
RedisRepositoryFactory  = require('./factory'),
LocatorConstituent      = require('superhero/core/locator/constituent')

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
    factory       = new RedisRepositoryFactory(),
    repository    = factory.create(options)

    return repository
  }
}

module.exports = RedisRepositoryLocator

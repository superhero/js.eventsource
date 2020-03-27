const
redis               = require('redis'),
RedisGateway        = require('./gateway'),
RedisRepository     = require('./repository')

/**
 * @memberof Infrastructure
 */
class RedisRepositoryLocator
{
  /**
   * @returns {RedisRepository}
   */
  create(options)
  {
    const
    subscriber    = redis.createClient(options),
    publisher     = redis.createClient(options),
    gateway       = new RedisGateway(subscriber, publisher)

    return new RedisRepository(gateway)
  }
}

module.exports = RedisRepositoryFactory

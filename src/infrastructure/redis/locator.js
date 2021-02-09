const
  redis                 = require('redis'),
  Redis                 = require('.'),
  RedisServiceStream    = require('./service/stream'),
  RedisServiceHash      = require('./service/hash'),
  RedisServicePublisher = require('./service/publisher'),
  LocatorConstituent    = require('superhero/core/locator/constituent')

/**
 * @memberof Infrastructure
 * @extends {superhero/core/locator/constituent}
 */
class RedisLocator extends LocatorConstituent
{
  /**
   * @returns {Redis}
   */
  locate()
  {
    const
      configuration = this.locator.locate('core/configuration'),
      options       = configuration.find('infrastructure/redis/gateway'),
      client        = redis.createClient(options),
      stream        = new RedisServiceStream(client),
      hash          = new RedisServiceHash(client),
      publisher     = new RedisServicePublisher(client),
      repository    = new Redis(stream, hash, publisher)

    return repository
  }
}

module.exports = RedisLocator

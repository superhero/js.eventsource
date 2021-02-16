const
  redis               = require('redis'),
  Redis               = require('.'),
  RedisKey            = require('./service/key'),
  RedisHash           = require('./service/hash'),
  RedisPublisher      = require('./service/publisher'),
  RedisStream         = require('./service/stream'),
  RedisTransaction    = require('./service/transaction'),
  LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Eventsource.Infrastructure
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
      key           = new RedisKey(client),
      hash          = new RedisHash(client),
      publisher     = new RedisPublisher(client),
      stream        = new RedisStream(client),
      factory       = this.locate.bind(this),
      transaction   = new RedisTransaction(client, factory)

    return new Redis(client, key, hash, publisher, stream, transaction)
  }
}

module.exports = RedisLocator

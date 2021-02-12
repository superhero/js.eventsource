const
  Redis               = require('.'),
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
      hash        = new RedisHash,
      publisher   = new RedisPublisher,
      stream      = new RedisStream,
      transaction = new RedisTransaction

    return new Redis(hash, publisher, stream, transaction)
  }
}

module.exports = RedisLocator



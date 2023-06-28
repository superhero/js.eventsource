const
  Writer              = require('.'),
  LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Eventsource.Server
 * @extends {superhero/core/locator/constituent}
 */
class WriterLocator extends LocatorConstituent
{
  /**
   * @returns {Writer}
   */
  locate()
  {
    const
      redis   = this.locator.locate('redis/client'),
      mapper  = this.locator.locate('eventsource/mapper')

    return new Writer(redis, mapper)
  }
}

module.exports = WriterLocator

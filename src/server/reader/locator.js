const
  Reader              = require('.'),
  LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Eventsource.Server
 * @extends {superhero/core/locator/constituent}
 */
class ReaderLocator extends LocatorConstituent
{
  /**
   * @returns {Reader}
   */
  locate()
  {
    const
      redis     = this.locator.locate('redis/client'),
      mapper    = this.locator.locate('eventsource/mapper'),
      deepmerge = this.locator.locate('core/deepmerge')

    return new Reader(redis, mapper, deepmerge)
  }
}

module.exports = ReaderLocator

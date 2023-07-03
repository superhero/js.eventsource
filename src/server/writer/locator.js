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
      redis     = this.locator.locate('redis/client'),
      mapper    = this.locator.locate('eventsource/mapper'),
      deepmerge = this.locator.locate('core/deepmerge'),
      reader    = this.locator.locate('eventsource/reader')

    return new Writer(redis, mapper, deepmerge, reader)
  }
}

module.exports = WriterLocator

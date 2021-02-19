const
  Process             = require('.'),
  LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Eventsource.Server.Domain
 * @extends {superhero/core/locator/constituent}
 */
class ProcessLocator extends LocatorConstituent
{
  /**
   * @returns {Process}
   */
  locate()
  {
    const
      redis     = this.locator.locate('redis/client'),
      publisher = redis.createSession(),
      deepmerge = this.locator.locate('core/deepmerge'),
      console   = this.locator.locate('core/console'),
      mapper    = this.locator.locate('eventsource/mapper')

    return new Process(redis, publisher, mapper, deepmerge, console)
  }
}

module.exports = ProcessLocator

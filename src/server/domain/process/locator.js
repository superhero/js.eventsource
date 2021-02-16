const
  Process             = require('.'),
  ProcessMapper       = require('./mapper'),
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
      redis     = this.locator.locate('infrastructure/redis'),
      deepmerge = this.locator.locate('core/deepmerge'),
      console   = this.locator.locate('core/console'),
      schema    = this.locator.locate('core/schema/composer'),
      mapper    = new ProcessMapper(schema)

    return new Process(redis, mapper, deepmerge, console)
  }
}

module.exports = ProcessLocator

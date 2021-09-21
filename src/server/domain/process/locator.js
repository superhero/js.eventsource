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
      mapper    = this.locator.locate('eventsource/mapper'),
      eventbus  = this.locator.locate('core/eventbus'),
      console   = this.locator.locate('core/console')

    return new Process(redis, publisher, mapper, eventbus, console)
  }
}

module.exports = ProcessLocator

const
  EventsourceClient   = require('.'),
  LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Eventsource.Client
 * @extends {superhero/core/locator/constituent}
 */
class EventsourceClientLocator extends LocatorConstituent
{
  /**
   * @returns {EventsourceClient}
   */
  locate()
  {
    const
      redis     = this.locator.locate('redis/client'),
      publisher = redis.createSession(),
      mapper    = this.locator.locate('eventsource/mapper')

    return new EventsourceClient(mapper, redis, publisher)
  }
}

module.exports = EventsourceClientLocator

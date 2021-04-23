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
      redis       = this.locator.locate('redis/client'),
      publisher   = redis.createSession(),
      subscriber  = redis.createSession(),
      mapper      = this.locator.locate('eventsource/mapper'),
      eventbus    = this.locator.locate('core/eventbus'),
      console     = this.locator.locate('core/console')

    return new EventsourceClient(mapper, redis, publisher, subscriber, eventbus, console)
  }
}

module.exports = EventsourceClientLocator

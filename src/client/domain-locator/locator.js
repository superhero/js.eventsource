const
  EventsourceClientDomainLocator  = require('.'),
  LocatorConstituent              = require('superhero/core/locator/constituent')

/**
 * @memberof Eventsource.Client
 * @extends {superhero/core/locator/constituent}
 */
class EventsourceClientDomainLocatorLocator extends LocatorConstituent
{
  /**
   * @returns {EventsourceClientDomainLocator}
   */
  locate()
  {
    const
      client  = this.locator.locate('eventsource/client'),
      mapper  = this.locator.locate('eventsource/mapper'),
      console = this.locator.locate('core/console')

    return new EventsourceClientDomainLocator(client, mapper, this.locator, console)
  }
}

module.exports = EventsourceClientDomainLocatorLocator

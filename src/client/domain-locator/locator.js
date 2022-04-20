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
      client        = this.locator.locate('eventsource/client'),
      mapper        = this.locator.locate('eventsource/mapper'),
      string        = this.locator.locate('core/string'),
      console       = this.locator.locate('core/console'),
      configuration = this.locator.locate('core/configuration'),
      options       = configuration.find('client/eventsource')

    return new EventsourceClientDomainLocator(options, client, mapper, this.locator, string, console)
  }
}

module.exports = EventsourceClientDomainLocatorLocator

const
  EventsourceClient         = require('.'),
  EventsourceClientFactory  = require('./factory'),
  LocatorConstituent        = require('superhero/core/locator/constituent')

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
      mapper        = this.locator.locate('eventsource/mapper'),
      eventbus      = this.locator.locate('core/eventbus'),
      console       = this.locator.locate('core/console'),
      reader        = this.locator.locate('eventsource/reader'),
      writer        = this.locator.locate('eventsource/writer'),
      configuration = this.locator.locate('core/configuration'),
      factory       = new EventsourceClientFactory(console, mapper, eventbus, reader, writer),
      optionsEs     = configuration.find('client/eventsource'),
      client        = factory.create(optionsEs)

    return client
  }
}

module.exports = EventsourceClientLocator

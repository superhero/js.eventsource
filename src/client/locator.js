const
  EventsourceClient   = require('.'),
  redis               = require('redis'),
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
      configuration = this.locator.locate('core/configuration'),
      options       = configuration.find('client/eventsource'),
      client        = redis.createClient(options)

    return new EventsourceClient(client)
  }
}

module.exports = EventsourceClientLocator

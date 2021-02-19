const
  EventsourceMapper   = require('.'),
  LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Eventsource.Mapper
 * @extends {superhero/core/locator/constituent}
 */
class EventsourceMapperLocator extends LocatorConstituent
{
  /**
   * @returns {EventsourceMapper}
   */
  locate()
  {
    const schema = this.locator.locate('core/schema/composer')
    return new EventsourceMapper(schema)
  }
}

module.exports = EventsourceMapperLocator

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
    const 
      schema = this.locator.locate('core/schema/composer'),
      string = this.locator.locate('core/string')

    return new EventsourceMapper(schema, string)
  }
}

module.exports = EventsourceMapperLocator

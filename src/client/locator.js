const
  EventsourceClient   = require('.'),
  LocatorConstituent  = require('superhero/core/locator/constituent'),
  RedisFactory        = require('../server/infrastructure/redis/factory')

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
      schema        = this.locator.locate('core/schema/composer'),
      options       = configuration.find('client/eventsource/gateway'),
      domain        = configuration.find('client/eventsource/domain'),
      timeout       = configuration.find('client/eventsource/timeout'),
      redisFactory  = new RedisFactory,
      redis         = redisFactory.create(options)

    return new EventsourceClient(redis, schema, domain, timeout)
  }
}

module.exports = EventsourceClientLocator
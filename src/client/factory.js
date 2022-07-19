const
  EventsourceClient = require('.'),
  RedisFactory      = require('@superhero/core.redis/src/client/factory')

/**
 * @memberof Eventsource.Client
 */
class EventsourceClientFactory
{
  constructor(console, mapper, eventbus, deepmerge)
  {
    this.console    = console
    this.mapper     = mapper
    this.eventbus   = eventbus
    this.deepmerge  = deepmerge
  }

  /**
   * @returns {EventsourceClient}
   */
  create(options)
  {
    const
      redisFactory  = new RedisFactory(),
      redis         = redisFactory.create(this.console, options),
      publisher     = redis.createSession(),
      subscriber    = redis.createSession()

    return new EventsourceClient(this.mapper, redis, publisher, subscriber, this.deepmerge, this.eventbus, this.console)
  }
}

module.exports = EventsourceClientFactory

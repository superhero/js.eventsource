const
  EventsourceClient = require('.'),
  RedisFactory      = require('@superhero/core.redis/src/client/factory')

/**
 * @memberof Eventsource.Client
 */
class EventsourceClientFactory
{
  constructor(console, mapper, eventbus, reader, writer)
  {
    this.console    = console
    this.mapper     = mapper
    this.eventbus   = eventbus
    this.reader     = reader
    this.writer     = writer
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

    return new EventsourceClient(this.mapper, redis, publisher, subscriber, this.reader, this.writer, this.eventbus, this.console)
  }
}

module.exports = EventsourceClientFactory

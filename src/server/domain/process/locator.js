const
  Process             = require('.'),
  LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Eventsource.Server.Domain
 * @extends {superhero/core/locator/constituent}
 */
class ProcessLocator extends LocatorConstituent
{
  /**
   * @returns {Process}
   */
  locate()
  {
    const
      redis         = this.locator.locate('redis/client'),
      publisher     = redis.createSession(),
      subscriber    = redis.createSession(),
      mapper        = this.locator.locate('eventsource/mapper'),
      eventbus      = this.locator.locate('core/eventbus'),
      console       = this.locator.locate('core/console'),
      configuration = this.locator.locate('core/configuration'),
      channels      = configuration.find('domain/process/channels'),
      authKey       = configuration.find('client/redis/auth')

    return new Process(redis, publisher, subscriber, mapper, eventbus, console, channels, authKey)
  }
}

module.exports = ProcessLocator

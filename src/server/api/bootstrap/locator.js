const
ApiBootstrap        = require('.'),
LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Eventsource.Api
 * @extends {superhero/core/locator/constituent}
 */
class ApiBootstrapLocator extends LocatorConstituent
{
  /**
   * @returns {ApiBootstrap}
   */
  locate()
  {
    const
    redis     = this.locator.locate('infrastructure/redis'),
    mysql     = this.locator.locate('infrastructure/mysql'),
    composer  = this.locator.locate('core/schema/composer'),
    eventbus  = this.locator.locate('core/eventbus'),
    console   = this.locator.locate('core/console')

    return new ApiBootstrap(redis, mysql, composer, eventbus, console)
  }
}

module.exports = ApiBootstrapLocator

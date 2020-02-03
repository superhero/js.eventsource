const
ApiBootstrap        = require('.'),
LocatorConstituent  = require('superhero/core/locator/constituent')

/**
 * @memberof Infrastructure
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
    redis     = this.locator.locate('repository/redis'),
    mysql     = this.locator.locate('repository/mysql'),
    composer  = this.locator.locate('core/schema/composer'),
    eventbus  = this.locator.locate('core/eventbus')

    return new ApiBootstrap(redis, mysql, composer, eventbus)
  }
}

module.exports = ApiBootstrapLocator

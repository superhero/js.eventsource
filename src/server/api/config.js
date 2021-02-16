/**
 * @namespace Eventsource.Server.Api
 */
module.exports =
{
  core:
  {
    bootstrap:
    {
      'redis-subscriber' : 'api/redis-subscriber'
    },
    locator:
    {
      'api/*' : __dirname + '/*'
    }
  }
}

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
  },
  api:
  {
    'redis-subscriber':
    {
      channels: 
      [
        'process-state-queued', 
        'process-state-persisted', 
        'process-state-queue-error'
      ]
    }
  }
}

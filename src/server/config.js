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
      'api/*'     : __dirname + '/api/*',
      'domain/*'  : __dirname + '/domain/*'
    },
    eventbus:
    {
      'observers' : 
      {
        'process-event-queued'  : { 'domain/process':true }, 
        'process-error-queued'  : { 'domain/process':true },
        'process-error'         : { 'domain/process':true } 
      }
    }
  },
  api:
  {
    'redis-subscriber':
    {
      channels: 
      [
        'process-error-queued',
        'process-event-queued'
      ]
    }
  },
  client:
  {
    redis:
    {
      gateway:
      {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    }
  }
}

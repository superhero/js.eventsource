/**
 * @namespace Eventsource.Server
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
    },
    http:
    {
      server:
      {
        timeout : 10e3,
        routes  :
        {
          'favicon':
          {
            endpoint : 'api/http/endpoint/favicon',
            url     : '/favicon.ico',
            input   : false,
            output  : false
          },
          'import':
          {
            endpoint: 'api/http/endpoint/import',
            url     : '/v1/import',
            method  : 'post',
            input   : false,
            output  : false
          },
          'export':
          {
            endpoint: 'api/http/endpoint/export',
            url     : '/v1/export',
            method  : 'post',
            input   : false,
            output  : false
          },
        }
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

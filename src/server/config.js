/**
 * @namespace Eventsource.Server
 */
module.exports =
{
  core:
  {
    bootstrap:
    {
      'domain-process' : 'domain/process'
    },
    locator:
    {
      'domain/*'  : __dirname + '/domain/*'
    },
    eventbus:
    {
      'observers' : 
      {
        'process-event-scheduled-cleared' : { 'domain/process':true },
        'process-event-scheduled'         : { 'domain/process':true },
        'process-error-scheduled'         : { 'domain/process':true },
        'schedule-error'                  : { 'domain/process':true },
        'process-event-queued'            : { 'domain/process':true },
        'process-error-queued'            : { 'domain/process':true },
        'process-error'                   : { 'domain/process':true }
      }
    }
  },
  domain:
  {
    process:
    {
      channels:
      [
        'process-event-scheduled',
        'process-error-scheduled',
        'process-event-queued',
        'process-error-queued'
      ]
    }
  },
  client:
  {
    redis:
    {
      auth    : process.env.REDIS_AUTH,
      gateway :
      {
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
      }
    }
  }
}

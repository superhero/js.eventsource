/**
 * @namespace Eventsource.Server
 */
module.exports =
{
  core:
  {
    bootstrap:
    {
      'set up subscribers' : 'process'
    },
    locator:
    {
      'process' : __dirname
    },
    eventbus:
    {
      'observers' : 
      {
        'process-event-scheduled-cleared' : { 'process':true },
        'process-event-scheduled'         : { 'process':true },
        'process-error-scheduled'         : { 'process':true },
        'schedule-error'                  : { 'process':true },
        'process-event-queued'            : { 'process':true },
        'process-error-queued'            : { 'process':true },
        'process-error'                   : { 'process':true }
      }
    }
  },
  process:
  {
    channels:
    [
      'process-event-scheduled',
      'process-error-scheduled',
      'process-event-queued',
      'process-error-queued'
    ]
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

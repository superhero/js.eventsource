/**
 * @namespace Eventsource.Server
 */
module.exports =
{
  core:
  {
    bootstrap:
    {
      'set up subscribers' : 'eventsource/process'
    },
    locator:
    {
      'eventsource/process' : __dirname,
      'eventsource/reader'  : __dirname + '/reader',
      'eventsource/writer'  : __dirname + '/writer'
    },
    eventbus:
    {
      'observers' : 
      {
        'process-event-scheduled-cleared' : { 'eventsource/process':true },
        'process-event-scheduled'         : { 'eventsource/process':true },
        'process-error-scheduled'         : { 'eventsource/process':true },
        'schedule-error'                  : { 'eventsource/process':true },
        'process-event-queued'            : { 'eventsource/process':true },
        'process-error-queued'            : { 'eventsource/process':true },
        'process-error'                   : { 'eventsource/process':true }
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

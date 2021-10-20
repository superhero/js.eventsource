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
        'process-event-scheduled' : { 'domain/process':true },
        'process-error-scheduled' : { 'domain/process':true },
        'schedule-error'          : { 'domain/process':true },
        'process-event-queued'    : { 'domain/process':true },
        'process-error-queued'    : { 'domain/process':true },
        'process-error'           : { 'domain/process':true }
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
      gateway:
      {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    }
  }
}

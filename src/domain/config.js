/**
 * @namespace Eventsource.Domain
 */
module.exports =
{
  core:
  {
    locator:
    {
      'domain/*' : __dirname + '/*'
    },
    eventbus:
    {
      'observers' : 
      {
        'process-event-queued'      : { 'domain/process':true }, 
        'process-state-persisted'   : { 'domain/process':true }, 
        'process-state-queue-error' : { 'domain/process':true }
      }
    }
  }
}

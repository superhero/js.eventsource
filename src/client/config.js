/**
 * @namespace Eventsource.Client
 */
module.exports =
{
  core:
  {
    locator:
    {
      'eventsource/client' : __dirname
    },
    eventbus:
    {
      'observers' : 
      {
        'process-consumer-error' : { 'eventsource/client':true }
      }
    }
  }
}

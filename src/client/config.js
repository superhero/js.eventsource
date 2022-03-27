/**
 * @namespace Eventsource.Client
 */
module.exports =
{
  core:
  {
    bootstrap:
    {
      'eventsource/client'                : 'eventsource/client',
      'eventsource/client/domain-locator' : 'eventsource/client/domain-locator'
    },
    locator:
    {
      'eventsource/client'                : __dirname,
      'eventsource/client/domain-locator' : __dirname + '/domain-locator'
    },
    eventbus:
    {
      'observers' : 
      {
        'process-consumer-error' : { 'eventsource/client':true },
        'process-observer-error' : { 'eventsource/client':true }
      }
    }
  },
  client:
  {
    eventsource:
    {
      domain  : '*',
      name    : '*'
    }
  }
}

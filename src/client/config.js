/**
 * @namespace Eventsource.Client
 */
module.exports =
{
  core:
  {
    bootstrap:
    {
      'eventsource/client'          : 'eventsource/client',
      'eventsource/client/consumer' : 'eventsource/client/consumer'
    },
    dependency:
    {
      'eventsource/mapper'  : __dirname + '/../mapper',
      'eventsource/schema'  : __dirname + '/../schema'
    },
    locator:
    {
      'eventsource/client'          : __dirname,
      'eventsource/client/consumer' : __dirname + '/consumer',
      'eventsource/reader'          : __dirname + '/../server/reader',
      'eventsource/writer'          : __dirname + '/../server/writer'
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

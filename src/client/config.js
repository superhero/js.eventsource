/**
 * @memberof Eventsource
 * @namespace Eventsource.Client
 */
module.exports =
{
  core:
  {
    locator:
    {
      'client/eventsource' : __dirname
    }
  },
  client:
  {
    eventsource:
    {
      domain  : '',
      timeout : 10e3,
      gateway :
      {
        host: '127.0.0.1',
        port: '6379'
      }
    }
  }
}

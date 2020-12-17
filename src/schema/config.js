/**
 * @namespace Eventsource.Domain
 */
module.exports =
{
  core:
  {
    schema:
    {
      composer:
      {
        'eventsource/shema/event/*' : __dirname + '/event/*',
        'eventsource/shema/value/*' : __dirname + '/value/*'
      }
    }
  }
}

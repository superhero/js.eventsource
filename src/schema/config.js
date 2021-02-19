/**
 * @namespace Eventsource.Schema
 */
module.exports =
{
  core:
  {
    schema:
    {
      composer:
      {
        'eventsource/schema/entity/*'  : __dirname + '/entity/*',
        'eventsource/schema/event/*'   : __dirname + '/event/*',
        'eventsource/schema/value/*'   : __dirname + '/value/*',
      }
    }
  }
}

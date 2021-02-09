/**
 * @namespace Domain
 */
module.exports =
{
  core:
  {
    schema:
    {
      composer:
      {
        'event/*' : __dirname + '/schema/event/*',
        'value/*' : __dirname + '/schema/value/*'
      }
    }
  }
}

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
        'event/*'         : __dirname + '/schema/event/*',
        'value-object/*'  : __dirname + '/schema/value-object/*'
      }
    }
  }
}

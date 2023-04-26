/**
 * @namespace Eventsource
 */
module.exports =
{
  core:
  {
    dependency:
    {
      'client/redis'        : '@superhero/core.redis/src/client',
      'eventsource/mapper'  : __dirname + '/src/mapper',
      'eventsource/schema'  : __dirname + '/src/schema',
      'eventsource/server'  : __dirname + '/src/server',
      'eventsource/client'  : __dirname + '/src/client'
    }
  }
}

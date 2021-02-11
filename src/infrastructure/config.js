/**
 * @namespace Eventsource.Infrastructure
 */
module.exports =
{
  core:
  {
    locator:
    {
      'infrastructure/*' : __dirname + '/*'
    }
  },
  infrastructure:
  {
    redis:
    {
      gateway:
      {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    }
  }
}

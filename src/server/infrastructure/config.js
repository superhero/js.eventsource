/**
 * @namespace Eventsource.Server.Infrastructure
 */
module.exports =
{
  client:
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

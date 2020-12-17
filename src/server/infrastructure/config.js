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
    mysql:
    {
      gateway:
      {
        connections : '5',
        host        : process.env.MYSQL_HOST,
        port        : process.env.MYSQL_PORT,
        user        : process.env.MYSQL_USER,
        password    : process.env.MYSQL_PASS,
        charset     : process.env.MYSQL_CHAR
      }
    },
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

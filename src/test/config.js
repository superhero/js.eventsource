/**
 * @namespace Eventsource.Test
 */
module.exports =
{
  infrastructure:
  {
    mysql:
    {
      gateway:
      {
        host      : 'localhost',
        port      : '3306',
        user      : 'root',
        password  : 'top-secret-password',
        charset   : 'utf8'
      }
    }
  },
  client:
  {
    eventsource:
    {
      domain  : 'test'
    },
    redis:
    {
      gateway:
      {
        host: '127.0.0.1',
        port: '6375'
      }
    }
  }
}

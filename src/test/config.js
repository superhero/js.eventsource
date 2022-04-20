/**
 * @namespace Eventsource.Test
 */
module.exports =
{
  core:
  {
    bootstrap:
    {
      'eventsource/client/domain-locator' : false
    }
  },
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
        url: 'redis://127.0.0.1:6379'
      }
    }
  }
}

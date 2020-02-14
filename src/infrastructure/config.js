/**
 * @namespace Infrastructure
 */
module.exports =
{
  core:
  {
    locator:
    {
      'repository/*' : __dirname + '/*'
    }
  },
  infrastructure:
  {
    mysql:
    {
      gateway:
      {
        connections : '5',
        host        : 'localhost',
        port        : '3306',
        user        : 'root',
        password    : 'top-secret-password',
        charset     : 'utf8'
      }
    },
    redis:
    {
      gateway:
      {
        host: '127.0.0.1',
        port: '6379'
      }
    }
  }
}

/**
 * @namespace Infrastructure
 */
module.exports =
{
  infrastructure:
  {
    mysql:
    {
      gateway:
      {
        connections : '5',
        host        : 'docker.adamo.es',
        port        : '3309',
        user        : 'root',
        password    : 'M1cB2DNIGALeu6nx',
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

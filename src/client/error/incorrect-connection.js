/**
 * @memberof Eventsource.Client
 */
class IncorrectConnectionError extends Error 
{
  constructor(...args)
  {
    super(...args)
    this.code = 'E_EVENTSOURCE_CLIENT_FAILED_CONNECTION'
  }
}

module.exports = IncorrectConnectionError
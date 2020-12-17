/**
 * @memberof Eventsource.Client
 */
class IncorrectQueryError extends Error 
{
  constructor(...args)
  {
    super(...args)
    this.code = 'E_EVENTSOURCE_CLIENT_INCORRECT_QUERY'
  }
}

module.exports = IncorrectQueryError
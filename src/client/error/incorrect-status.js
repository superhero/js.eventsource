/**
 * @memberof Eventsource.Client
 */
class IncorrectStatusError extends Error 
{
  constructor(...args)
  {
    super(...args)
    this.code = 'E_EVENTSOURCE_CLIENT_INCORRECT_STATUS'
  }
}

module.exports = IncorrectStatusError
/**
 * @memberof Eventsource.Client
 */
class FailedToPersistLazyloadedData extends Error 
{
  constructor(...args)
  {
    super(...args)
    this.code = 'E_EVENTSOURCE_FAILED_TO_PERSIST_LAZYLOADED_DATA'
  }
}

module.exports = FailedToPersistLazyloadedData
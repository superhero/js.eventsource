/**
 * @memberof Eventsource.Client
 */
class FailedLazyloadingCallbackError extends Error 
{
  constructor(...args)
  {
    super(...args)
    this.code = 'E_EVENTSOURCE_FAILED_LAZYLOADING_CALLBACK'
  }
}

module.exports = FailedLazyloadingCallbackError
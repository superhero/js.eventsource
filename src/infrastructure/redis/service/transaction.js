/**
 * @memberof Eventsource.Infrastructure
 */
class RedisServiceTransaction
{
  constructor(gateway)
  {
    this.gateway = gateway
  }

  /**
   * TODO requires a seperate connection for each transaction?
   */
  multi()
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.multi((previousError) =>
      {
        if(previousError)
        {
          const error = new Error('multi command failed')
          error.code  = 'E_REDIS_MULTI'
          error.chain = { previousError }
          reject(error)
        }

        accept()
      })
    })
  }

  /**
   * Optemistic locking using check and set https://redis.io/topics/transactions#cas
   */
  exec()
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.exec((previousError) =>
      {
        if(previousError)
        {
          const error = new Error('exec command failed')
          error.code  = 'E_REDIS_EXEC'
          error.chain = { previousError }
          reject(error)
        }

        accept()
      })
    })
  }

  discard()
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.discard((previousError) =>
      {
        if(previousError)
        {
          const error = new Error('discard command failed')
          error.code  = 'E_REDIS_DISCARD'
          error.chain = { previousError }
          reject(error)
        }

        accept()
      })
    })
  }

  unwatch()
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.unwatch((previousError) =>
      {
        if(previousError)
        {
          const error = new Error('unwatch command failed')
          error.code  = 'E_REDIS_UNWATCH'
          error.chain = { previousError }
          reject(error)
        }

        accept()
      })
    })
  }

  watch(...keys)
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.watch(...keys, (previousError) =>
      {
        if(previousError)
        {
          const error = new Error('watch command failed')
          error.code  = 'E_WATCH_UNWATCH'
          error.chain = { previousError, keys }
          reject(error)
        }

        accept()
      })
    })
  }
}

module.exports = RedisServiceTransaction

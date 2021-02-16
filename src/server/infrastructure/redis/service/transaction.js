/**
 * @memberof Eventsource.Server.Infrastructure
 */
class RedisServiceTransaction
{
  constructor(gateway)
  {
    this.gateway = gateway
  }

  begin(...args)
  {
    return this.multi(...args)
  }

  multi()
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.send_command('MULTI', (previousError) =>
      {
        if(previousError)
        {
          const error = new Error('multi command failed')
          error.code  = 'E_REDIS_TRANSACTION_MULTI'
          error.chain = { previousError }
          reject(error)
        }

        accept()
      })
    })
  }

  commit(...args)
  {
    return this.exec(...args)
  }

  /**
   * TODO, if response is null, then an error also occired, map accoringly
   * Optemistic locking using check and set https://redis.io/topics/transactions#cas
   */
  exec()
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.send_command('EXEC', (previousError, response) =>
      {
        if(previousError)
        {
          const error = new Error('exec command failed')
          error.code  = 'E_REDIS_TRANSACTION_EXEC'
          error.chain = { previousError }
          reject(error)
        }

        accept(response)
      })
    })
  }

  roleback(...args)
  {
    return this.discard(...args)
  }

  discard()
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.send_command('DISCARD', (previousError) =>
      {
        if(previousError)
        {
          const error = new Error('discard command failed')
          error.code  = 'E_REDIS_TRANSACTION_DISCARD'
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
      this.gateway.send_command('UNWATCH', (previousError) =>
      {
        if(previousError)
        {
          const error = new Error('unwatch command failed')
          error.code  = 'E_REDIS_TRANSACTION_UNWATCH'
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
      this.gateway.send_command('WATCH', keys, (previousError) =>
      {
        if(previousError)
        {
          const error = new Error('watch command failed')
          error.code  = 'E_REDIS_TRANSACTION_WATCH'
          error.chain = { previousError, keys }
          reject(error)
        }

        accept()
      })
    })
  }
}

module.exports = RedisServiceTransaction

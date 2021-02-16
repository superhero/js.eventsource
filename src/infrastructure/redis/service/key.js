/**
 * @memberof Eventsource.Infrastructure
 */
class RedisServiceKey
{
  constructor(gateway)
  {
    this.gateway = gateway
  }

  write(key, value)
  {
    return new Promise((accept, reject) =>
    {
      const encoded = JSON.stringify(value)

      this.gateway.set(key, encoded, (previousError) =>
      {
        if(previousError)
        {
          const error = new Error('set key failed')
          error.code  = 'E_REDIS_KEY_WRITE'
          error.chain = { previousError, key, value }
          reject(error)
        }

        accept()
      })
    })
  }

  read(key)
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.get(key, (previousError, result) =>
      {
        if(previousError)
        {
          const error = new Error('get key failed')
          error.code  = 'E_REDIS_KEY_READ'
          error.chain = { previousError, key }
          reject(error)
        }

        const decoded = JSON.parse(result)

        accept(decoded)
      })
    })
  }
}

module.exports = RedisServiceKey

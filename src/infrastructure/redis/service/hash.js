/**
 * @memberof Eventsource.Infrastructure
 */
class RedisServiceHash
{
  constructor(gateway)
  {
    this.gateway = gateway
  }

  write(key, field, value)
  {
    return new Promise((accept, reject) =>
    {
      const encoded = JSON.stringify(value)

      this.gateway.hset(key, field, encoded, (previousError) =>
      {
        if(previousError)
        {
          const error = new Error('stream error occured')
          error.code  = 'E_REDIS_HASH_WRITE'
          error.chain = { previousError, group, stream, msg }
          reject(error)
        }

        accept()
      })
    })
  }

  read(key, field)
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.hget(key, field, (previousError, result) =>
      {
        if(previousError)
        {
          const error = new Error('stream error occured')
          error.code  = 'E_REDIS_HASH_READ'
          error.chain = { previousError, group, stream, msg }
          reject(error)
        }

        const decoded = JSON.parse(result)

        accept(decoded)
      })
    })
  }
}

module.exports = RedisServiceHash

/**
 * @memberof Eventsource.Server.Infrastructure
 */
class Redis
{
  constructor(gateway, factory, key, hash, publisher, stream, transaction)
  {
    this.gateway        = gateway
    this.createSession  = factory
    this.key            = key
    this.hash           = hash
    this.publisher      = publisher
    this.stream         = stream
    this.transaction    = transaction
  }

  quit()
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.quit((previousError) =>
      {
        if(previousError)
        {
          const error = new Error('write hash error occured')
          error.code  = 'E_REDIS_QUIT'
          error.chain = { previousError }
          reject(error)
        }

        accept()
      })
    })
  }
}

module.exports = Redis

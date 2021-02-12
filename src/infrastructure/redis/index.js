/**
 * @memberof Eventsource.Infrastructure
 */
class Redis
{
  constructor(hash, publisher, stream, transaction)
  {
    this.hash         = hash
    this.publisher    = publisher
    this.stream       = stream
    this.transaction  = transaction
  }
}

module.exports = Redis

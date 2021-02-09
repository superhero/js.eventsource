/**
 * @memberof Infrastructure
 */
class Redis
{
  constructor(stream, hash, publisher)
  {
    this.stream     = stream
    this.hash       = hash
    this.publisher  = publisher
  }
}

module.exports = Redis

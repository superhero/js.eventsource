/**
 * @memberof Infrastructure
 */
class MysqlRepository
{
  constructor(gateway, json2sql, console)
  {
    this.gateway  = gateway
    this.json2sql = json2sql
    this.console  = console
  }

  /**
   * @param {Domain.RequestedToFetch} event
   * @returns {stream.Readable}
   */
  fetchStream(event)
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.adaptor.pool.getConnection((error, connection) =>
      {
        if(error)
        {
          reject(error)
        }
        else
        {
          try
          {
            const 
            query   = this.json2sql.build(event.query),
            stream  = connection.query(query.sql, query.values)

            accept(stream)
          }
          catch(error)
          {
            this.console.error('error in fetch stream', 'error:', error, 'event:', event)
            reject(error)
          }
          finally
          {
            connection.release()
          }
        }
      })
    })
  }

  /**
   * @param {Domain.RequestedToPersist} event
   */
  persist(event)
  {
    const
    query     = this.json2sql.build(event.query),
    response  = this.gateway.adaptor.query(query.sql, query.values)

    return response
  }
}

module.exports = MysqlRepository

/**
 * @memberof Infrastructure
 */
class MysqlRepository
{
  constructor(gateway, json2sql)
  {
    this.gateway  = gateway
    this.json2sql = json2sql
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
          const
          query   = this.json2sql.build(event.query),
          stream  = connection.query(query.sql, query.values)

          connection.release()

          accept(stream)
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

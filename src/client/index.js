const 
  IncorrectConnectionError    = require('./error/incorrect-connection'),
  IncorrectQueryError         = require('./error/incorrect-query'),
  IncorrectStatusError        = require('./error/incorrect-status'),
  FailedLazyloadingCallback   = require('./error/failed-lazyloading-callback'),
  FailedToWriteLazyloadedData = require('./error/failed-to-write-lazyloaded-data')

/**
 * @memberof Infrastructure
 */
class EventsourceClient
{
  /**
   * @param {Eventsource.Infrastructure.Redis} redis
   * @param {superhero/core/schema/composer} schema
   * @param {string} domain
   * @param {string} timeout client timeout, if the server has not responded in this time then throw an error
   */
  constructor(redis, schema, domain, timeout)
  {
    this.redis    = redis
    this.schema   = schema
    this.domain   = domain
    this.timeout  = timeout
  }

  /**
   * @param {string} ppid
   * @param {string} pid
   * @param {string} eventname
   * @param {Object} eventdata
   * @async
   */
  write(ppid, pid, eventname, eventdata)
  {
    return new Promise((accept, reject) =>
    {
      const
        id      = this.generateId(),
        channel = this.domain + '-persist-channel-' + id

      let query = 
      {
        '$insert':
        {
          '$documents':
          {
            'ppid'    : ppid,
            'pid'     : pid,
            'domain'  : this.domain,
            'name'    : eventname,
            'data'    : this.encodeEventdata(eventdata)
          }
        }
      }

      try
      {
        query = this.schema.compose('eventsource/shema/value/query-persist', query)
      }
      catch(previousError)
      {
        const error = new IncorrectQueryError('input model to write to the eventsource is invalid')
        error.chain = { previousError, query, eventdata }
        throw error
      }

      let result = ''

      this.redis.on(channel, (data) =>
      {
        clearTimeout(clientTimeoutId)

        try
        {
          if(data === 'end')
          {
            accept(result)
          }
          else if(data === 'error')
          {
            const error = new IncorrectStatusError('error repported by the eventsource server')
            error.chain = { ppid, pid, query, channel, result, data }
            reject(error)
          }
          else if(data === 'timeout')
          {
            const error = new IncorrectStatusError('timeout repported by the eventsource')
            error.chain = { ppid, pid, query, channel, result, data }
            reject(error)
          }
          else
          {
            result = data
          }
        }
        catch(error)
        {
          reject(error)
        }
      })

      this.redis.subscribe(channel)
      this.redis.publish('persist', { channel, query })

      const clientTimeoutId = setTimeout(() => 
      {
        const error = new IncorrectConnectionError('client timeout occured when waiting for the eventsource server')
        error.chain = { ppid, pid, eventname, eventdata }
        reject(error)
      }, this.timeout)
    })
  }

  /**
   * @param {Eventsource.Shema.EventRequestedToFetch} query
   * @async
   */
  read(query)
  {
    return new Promise((accept, reject) =>
    {
      try
      {
        query = this.schema.compose('eventsource/shema/value/query-fetch', query)
      }
      catch(previousError)
      {
        const error = new IncorrectQueryError('input model to read from the eventsource is invalid')
        error.chain = { previousError, query }
        throw error
      }

      const
        id          = this.generateId(),
        channel     = this.domain + '-fetch-channel-' + id,
        collection  = []

      this.redis.subscribe(channel)

      this.redis.on(channel, (data) =>
      {
        clearTimeout(clientTimeoutId)

        try
        {
          if(data === 'end')
          {
            accept(collection)
          }
          else if(data === 'error')
          {
            const error = new IncorrectStatusError('error repported by the eventsource server')
            error.chain = { query, channel, collection, data }
            reject(error)
          }
          else if(data === 'timeout')
          {
            const error = new IncorrectStatusError('timeout repported by the eventsource')
            error.chain = { query, channel, collection, data }
            reject(error)
          }
          else
          {
            collection.push(data)
            this.redis.publish('fetch-next', { channel })
          }
        }
        catch(error)
        {
          reject(error)
        }
      })

      this.redis.publish('fetch', { channel, query })

      const clientTimeoutId = setTimeout(() => 
      {
        const error = new IncorrectConnectionError('client timeout occured when waiting for the eventsource server')
        error.chain = { ppid, pid, eventname, eventdata }
        reject(error)
      }, this.timeout)
    })
  }

  /**
   * @param {string} pid
   * @param {string?} eventname
   * @async
   */
  has(pid, eventname)
  {
    return new Promise((accept, reject) =>
    {
      const
        id      = this.generateId(),
        channel = this.domain + '-has-channel-' + id,
        query   =
        {
          '$select':
          {
            '$where': eventname
            ? {
                'pid'   : pid,
                'name'  : eventname
              }
            : {
                'pid' : pid
              },
            '$limit': 1
          }
        }

      this.redis.subscribe(channel)

      const collection = []
      this.redis.on(channel, (data) =>
      {
        clearTimeout(clientTimeoutId)

        try
        {
          if(data === 'end')
          {
            accept(!!collection.length)
          }
          else if(data === 'error')
          {
            const error = new IncorrectStatusError('error repported by the eventsource server')
            error.chain = { pid, collection, query, channel, data }
            reject(error)
          }
          else if(data === 'timeout')
          {
            const error = new IncorrectStatusError('timeout repported by the eventsource')
            error.chain = { pid, collection, query, channel, data }
            reject(error)
          }
          else
          {
            collection.push(data)
            this.redis.publish('fetch-next', { channel })
          }
        }
        catch(error)
        {
          reject(error)
        }
      })

      this.redis.publish('fetch', { channel, query })

      const clientTimeoutId = setTimeout(() => 
      {
        const error = new IncorrectConnectionError('client timeout occured when waiting for the eventsource server')
        error.chain = { ppid, pid, eventname, eventdata }
        reject(error)
      }, this.timeout)
    })
  }

  encodeEventdata(eventdata)
  {
    const result = eventdata instanceof Error
    ? this.encodeEventdataError(eventdata)
    : eventdata || {}

    return result
  }

  encodeEventdataError(error)
  {
    const
      properties  = Object.getOwnPropertyNames(error),
      result      = {}

    for(const property of properties)
      result[property] = error[property] instanceof Error
      ? this.encodeEventdataError(error[property])
      : error[property] || {}

    return result
  }

  generateId()
  {
    const
      now     = Date.now().toString(36),
      random  = (Math.random() * 1e22).toString(36),
      id      = (now + random).substr(0, 20)

    return id
  }

  /**
   * @param {string} eventlog
   * @param {Array<string>|string} eventnames
   */
  isPreconditionMet(eventlog, eventnames)
  {
    eventnames = Array.isArray(eventnames) ? eventnames : [eventnames]
    return eventnames.every(eventname => eventlog.some(event => event.name === eventname))
  }

  /**
   * @param {string} ppid
   * @param {string} pid
   * @param {string} eventlog
   * @param {string} eventname
   * @param {function} callback
   */
  async lazy(ppid, pid, eventlog, eventname, callback)
  {
    const filteredEventlog = eventlog.filter(event => event.name === eventname)

    let data

    if(filteredEventlog.length)
    {
      const latestData = filteredEventlog.pop().data
      data = JSON.parse(latestData)
    }
    else
    {
      try
      {
        data = await callback()
      }
      catch(previousError)
      {
        const error = new FailedLazyloadingCallback('eventsource lazyloading callback failed')
        error.chain = { previousError, pid, eventname }
        throw error
      }
      try
      {
        await this.write(ppid, pid, eventname, data)
      }
      catch(previousError)
      {
        const error = new FailedToWriteLazyloadedData('failed to write lazyloaded data to the eventsource')
        error.chain = { previousError, pid, eventname, data }
        throw error
      }
    }

    return data
  }

  /**
   * @param {string} ppid
   * @async
   */
  readByPpid(ppid)
  {
    const query =
    {
      '$select':
      {
        '$where':
        {
          'ppid'    : ppid,
          'domain'  : this.domain 
        },
        '$orderBy':
        {
          'timestamp' : true // ASC
        }
      }
    }

    return this.read(query)
  }

  /**
   * @param {string} pid
   * @async
   */
  readByPid(pid)
  {
    const query =
    {
      '$select':
      {
        '$where':
        {
          'pid'     : pid,
          'domain'  : this.domain 
        },
        '$orderBy':
        {
          'timestamp' : true // ASC
        }
      }
    }

    return this.read(query)
  }

  /**
   * @param {string} name
   * @async
   */
  readByName(name)
  {
    const query =
    {
      '$select':
      {
        '$where':
        {
          'name'    : name,
          'domain'  : this.domain
        }
      },
      '$orderBy':
      {
        'timestamp' : true // ASC
      }
    }

    return this.read(query)
  }

  /**
   * @param {string} name
   * @async
   */
  readByTimeRange(from, to)
  {
    const query =
    {
      '$select':
      {
        '$where':
        {
          '$and':
          [
            { 
              'timestamp':
              {
                '$gt'  : from,
                '$lte' : to
              }
            },
            { 'domain' : this.domain }
          ]
        },
        '$orderBy':
        {
          'timestamp' : true // ASC
        }
      }
    }

    return this.read(query)
  }
}

module.exports = EventsourceClient
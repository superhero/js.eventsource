/**
 * @memberof Infrastructure
 */
class RedisServiceStream
{
  constructor(gateway)
  {
    this.gateway = gateway
  }

  write(channel, msg)
  {
    const
      group   = 'group-'  + channel,
      stream  = 'stream-' + channel,
      entries = Object.entries(msg),
      dto     = []

    // mapping message entries to a dto
    for(let i = 0; i < entries.length; i++)
    {
      dto.push(entries[0])
      dto.push(JSON.stringify(entries[1]))
    }

    return new Promise((accept, reject) =>
    {
      this.gateway.xadd(stream, '*', ...dto, (previousError) =>
      {
        if(previousError)
        {
          const error = new Error('stream error occured')
          error.code  = 'E_REDIS_STREAM_WRITE_ERROR'
          error.chain = { previousError, group, stream, msg }
          reject(error)
        }

        accept()
      })
    })
  }

  read(channel, consumer)
  {
    const
      group   = 'group-'  + channel,
      stream  = 'stream-' + channel

    return new Promise((accept, reject) =>
    {
      this.gateway.xreadgroup('GROUP', group, 'consumer', 'STREAMS', stream, '>', async (previousError, result) =>
      {
        if(previousError)
        {
          const error = new Error('stream error occured')
          error.code  = 'E_REDIS_STREAM_READ_ERROR'
          error.chain = { previousError, group, stream }
          reject(error)
        }
        else if(result === null)
        {
          const error = new Error('no messages to be consumed was found')
          error.code  = 'E_REDIS_STREAM_READ_NULL_ERROR'
          error.chain = { group, stream }
          reject(error)
        }
        else
        {
          const
            id  = result[0][1][0][0],
            dto = result[0][1][0][1],
            msg = {}

          // mapping dto from a csv array to a json object
          for(let i = 1; i < dto.length; i += 2)
          {
            const
              key = dto[i-1],
              val = JSON.parse(dto[i])

            msg[key] = val
          }

          try
          {
            const result = await consumer(msg)
            this.gateway.xack(stream, group, id)
            accept(result)
          }
          catch(previousError)
          {
            const error = new Error('consumer failed')
            error.code  = 'E_REDIS_STREAM_READ_CONSUMER_ERROR'
            error.chain = { previousError, group, stream, id, msg }
            reject(error)
          }
        }
      })
    })
  }
}

module.exports = RedisServiceStream

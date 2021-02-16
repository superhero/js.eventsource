/**
 * @memberof Eventsource.Server.Infrastructure
 */
class RedisServiceStream
{
  constructor(gateway, schema)
  {
    this.gateway = gateway
    this.schema  = schema
  }

  write(channel, msg)
  {
    return new Promise((accept, reject) =>
    {
      const
        info    = this.mapToChannelInfo(channel),
        entries = Object.entries(msg),
        dto     = []
  
      // TODO move to mapper
      // mapping message entries to a dto
      for(let i = 0; i < entries.length; i++)
      {
        dto.push(entries[0])
        dto.push(JSON.stringify(entries[1]))
      }

      this.gateway.xadd(info.stream, '*', ...dto, (previousError) =>
      {
        if(previousError)
        {
          const error = new Error('stream error occured')
          error.code  = 'E_REDIS_STREAM_WRITE'
          error.chain = { previousError, ...info, msg }
          reject(error)
        }

        accept()
      })
    })
  }

  read(channel, consumer)
  {
    return new Promise((accept, reject) =>
    {
      this.gateway.xreadgroup('GROUP', channel, 'consumer', 'STREAMS', channel, '>', async (previousError, result) =>
      {
        if(previousError)
        {
          const error = new Error('stream error occured')
          error.code  = 'E_REDIS_STREAM_READ_GATEWAY'
          error.chain = { previousError, channel }
          reject(error)
        }
        else if(result === null)
        {
          accept(result)
        }
        else
        {
          const
            id  = result[0][1][0][0],
            dto = result[0][1][0][1],
            msg = {}

          // TODO move to mapper
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
            await consumer(msg)
            this.gateway.xack(channel, channel, id)
            accept(event)
          }
          catch(previousError)
          {
            const error = new Error('consumer failed')
            error.code  = 'E_REDIS_STREAM_READ_CONSUMER'
            error.chain = { previousError, channel, id, msg }
            reject(error)
          }
        }
      })
    })
  }
}

module.exports = RedisServiceStream

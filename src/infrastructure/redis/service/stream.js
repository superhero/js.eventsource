/**
 * @memberof Eventsource.Infrastructure
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
        event   = this.schema.compose('eventsource/schema/entity/process-event', msg),
        info    = this.mapToChannelInfo(channel),
        entries = Object.entries(event),
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
          error.code  = 'E_REDIS_STREAM_WRITE_ERROR'
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
      const info = this.mapToChannelInfo(channel)
      this.gateway.xreadgroup('GROUP', info.group, 'consumer', 'STREAMS', info.stream, '>', async (previousError, result) =>
      {
        if(previousError)
        {
          const error = new Error('stream error occured')
          error.code  = 'E_REDIS_STREAM_READ_GATEWAY'
          error.chain = { previousError, ...info }
          reject(error)
        }
        else if(result === null)
        {
          const error = new Error('no messages to be consumed was found')
          error.code  = 'E_REDIS_STREAM_READ_NULL'
          error.chain = { ...info }
          reject(error)
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
            const 
              event   = this.schema.compose('eventsource/schema/entity/process-event', msg),
              result  = await consumer(event)

            this.gateway.xack(info.stream, info.group, id)
            accept(result)
          }
          catch(previousError)
          {
            const error = new Error('consumer failed')
            error.code  = 'E_REDIS_STREAM_READ_CONSUMER'
            error.chain = { previousError, ...info, id, msg }
            reject(error)
          }
        }
      })
    })
  }

  /**
   * TODO move to mapper
   * @param {string} channel 
   */
  mapToChannelInfo(channel)
  {
    const
      group   = 'group-'  + channel,
      stream  = 'stream-' + channel

    return { group, stream }
  }
}

module.exports = RedisServiceStream

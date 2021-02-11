/**
 * @memberof Eventsource.Api
 */
class RedisSubscriber
{
  constructor(client, eventbus)
  {
    this.client   = client
    this.eventbus = eventbus
  }

  async bootstrap()
  {
    for(channel of ['process-event-queued', 'process-state-persisted'])
    {
      this.subscriber.subscribe(channel)
      await this.lazyloadConsumerGroup(channel)
    }

    this.client.on('message', async (channel, message) =>
    {
      try
      {
        const dto = JSON.parse(message)

        switch(channel)
        {
          case 'process-event-queued':
          case 'process-state-persisted':
          {
            this.eventbus.emit(channel, dto)
          }
        }
      }
      catch(error)
      {
        this.onError(error)
      }
    })
  }

  lazyloadConsumerGroup(channel)
  {
    return new Promise((accept, reject) =>
    {
      const 
        stream  = 'stream-' + channel, 
        group   = 'group-'  + channel

      this.gateway.xgroup('CREATE', stream, group, '$', 'MKSTREAM', (error) =>
      {
        if(error)
        {
          switch(error.code)
          {
            case 'BUSYGROUP': break
            default: throw reject(error)
          }
        }
        accept()
      })
    })
  }

  onError(error)
  {
    throw error
  }

  close()
  {
    this.client.unsubscribe()
    this.client.quit()
  }
}

module.exports = RedisSubscriber

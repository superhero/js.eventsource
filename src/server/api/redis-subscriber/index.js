/**
 * @memberof Eventsource.Server.Api
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
    for(channel of ['process-event-queued', 'process-state-persisted', 'process-state-queue-error'])
    {
      this.subscriber.subscribe(channel)
      await this.lazyloadConsumerGroup(channel)
    }

    this.client.on('message', async (channel, message) =>
    {
      try
      {
        switch(channel)
        {
          case 'process-event-queued':
          case 'process-state-persisted':
          case 'process-state-queue-error':
          {
            const dto = JSON.parse(message)
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
      this.gateway.xgroup('CREATE', channel, channel, '$', 'MKSTREAM', (error) =>
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

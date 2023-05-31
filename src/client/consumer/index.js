/**
 * @memberof Eventsource.Client
 */
class EventsourceClientConsumer
{
  constructor(config, client, mapper, locator, string, console)
  {
    this.config   = config
    this.client   = client
    this.mapper   = mapper
    this.locator  = locator
    this.string   = string
    this.console  = console
  }
  
  async bootstrap()
  {
    this.console.color('blue').log('✔ eventsource consume › ' + this.config.domain + ' › ' + this.config.name)

    await this.client.consume(this.config.domain, this.config.name, async (event, ...args) =>
    {
      this.console.color('blue').log('⁉ ' + event.pid + ' › ' + event.domain + ' › ' + event.name)

      let service

      try
      {
        service = this.locator.locate(event.domain)
      }
      catch(error)
      {
        this.console.color('red').log('✗ ' + event.pid + ' › ' + event.domain + ' › ' + event.name + ' » can not locate service')
        return
      }

      const
        channel = event.name.replace('.', '_').replace('-', ' '),
        action  = this.string.composeCamelCase('on ' + channel, ' ')

      if(action in service)
      {
        try
        {
          await service[action](event, ...args)
          this.console.color('green').log('✔ ' + event.pid + ' › ' + event.domain + ' › ' + event.name)
        }
        catch(error)
        {
          this.console.color('red').log('✗ ' + event.pid + ' › ' + event.domain + ' › ' + event.name)
          try
          {
            await service.onError(event, error)
          }
          catch(serviceError)
          {
            this.console.color('red').log('✗ ' + event.pid + ' › ' + event.domain + ' › ' + event.name + ' » service failed to handle error')
            serviceError.context                = {}
            serviceError.context.previousError  = error
            serviceError.context.action         = action
            throw serviceError
          }
        }
      }
      else
      {
        this.console.color('red').log('✗ ' + event.pid + ' › ' + event.domain + ' › ' + event.name + ' » action is not supported by the service')
      }
    })
  }
}

module.exports = EventsourceClientConsumer

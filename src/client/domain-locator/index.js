/**
 * @memberof Eventsource.Client
 */
class EventsourceClientDomainLocator
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
    this.console.color('cyan').log('✔ eventsource client is configured to consume all domains and events')
    await this.client.consume(this.config.domain, this.config.name, async (event, ...args) =>
    {
      let service

      try
      {
        service = this.locator.locate(event.domain)
      }
      catch(error)
      {
        this.console.color('yellow').log(`eventsource - consume message failed - aggregate: "${event.domain}" `
                                       + `can not be located for observered event: "${event.name}", `
                                       + `pid: "${event.pid}"`)

        return
      }

      const
        filteredChannel = event.name.replace('.', '_').replace('-', ' '),
        action          = this.string.composeCamelCase('on ' + filteredChannel, ' ')

      if(action in service)
      {
        try
        {
          await service[action](event, ...args)
        }
        catch(error)
        {
          try
          {
            await service.onError(event, error)
          }
          catch(errorOnError)
          {
            this.console.color('red').log(`eventsource - consume error message failed - aggregate: "${event.domain}" `
                                        + `failed to handle error for channel: "${filteredChannel}", `
                                        + `error: "${errorOnError.message}", `
                                        + `previous error: "${error.message}", `
                                        + `pid: "${event.pid}"`)
          }
        }
      }
      else
      {
        this.console.color('yellow').log(`eventsource - consume message failed - channel: "${filteredChannel}" `
                                       + `does not have a registered observer in aggregate: "${event.domain}", `
                                       + `lost message for pid: "${event.pid}"`)
      }
    })
  }
}

module.exports = EventsourceClientDomainLocator

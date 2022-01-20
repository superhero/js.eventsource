/**
 * @memberof Eventsource.Client
 */
class EventsourceClientDomainLocator
{
  constructor(client, mapper, locator, console)
  {
    this.client   = client
    this.mapper   = mapper
    this.locator  = locator
    this.console  = console
  }
  
  async bootstrap()
  {
    await this.client.consume('*', '*', async (event, ...args) =>
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
            await service.onError(event.pid, error)
          }
          catch(error2)
          {
            this.console.color('red').log(`eventsource - consume error message failed - aggregate: "${event.domain}" `
                                        + `failed to handle error for channel: "${filteredChannel}", `
                                        + `error: "${error2.message}", `
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

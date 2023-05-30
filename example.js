const
  CoreFactory = require('superhero/core/factory'),
  coreFactory = new CoreFactory,
  core        = coreFactory.create()

core.add('eventsource', '@superhero/core.eventsource')

core.load()

core.locate('core/bootstrap').bootstrap().then(async () =>
{
  const
    group       = 'replicator-example',
    eventsource = core.locate('eventsource/client'),
    domain      = '*',
    eventname   = '*',
    channel     = eventsource.mapper.toProcessPersistedChannel(domain, eventname)

  let process

  while(process = await eventsource.readStreamByChannel(group, channel, id))
  {
    const event = await eventsource.readEventById(id)

    switch(event.domain)
    {
      case '':
      {
        switch(event.name)
        {
          case '':
          {
  
          }
          default:
          {
            core.locate('core/console').log('no replication state for the event: ' + event.name)
            break
          }
        }
      }
      default:
      {
        core.locate('core/console').log('no replication state for the domain: ' + event.domain)
      }
    }
  }
})

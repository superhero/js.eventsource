describe('Eventsource test suit', () =>
{
  let core

  before((done) =>
  {
    const
      CoreFactory = require('superhero/core/factory'),
      coreFactory = new CoreFactory

    core = coreFactory.create()

    core.add('api')
    core.add('infrastructure')
    core.add('schema', __dirname + '/../schema')
    core.add('client', __dirname + '/../client')
    core.add('test', __dirname)

    core.load()

    core.locate('core/bootstrap').bootstrap().then(done)
  })

  after(() =>
  {
    core.locate('infrastructure/redis').gateway.close()
    core.locate('infrastructure/mysql').gateway.close()
    core.locate('client/eventsource').redis.gateway.close()
  })

  const
    ppid      = Date.now().toString(32),
    pid       = Date.now().toString(36),
    eventname = 'test-event',
    eventdata = { test:'data' }

  it('can write an event to the eventsource system', async () =>
  {
    const 
      client = core.locate('client/eventsource'),
      result = await client.write(ppid, pid, eventname, eventdata)

    core.locate('core/console').log(result)
  })

  it('can read an event from the eventsource system', async () =>
  {
    const 
      client = core.locate('client/eventsource'),
      result = await client.readByPid(pid)

    core.locate('core/console').log(result)
  })
})

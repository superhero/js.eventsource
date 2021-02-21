const
  expect  = require('chai').expect,
  context = require('mochawesome/addContext')

describe('Eventsource test suit', () =>
{
  let core

  before((done) =>
  {
    const
      CoreFactory = require('superhero/core/factory'),
      coreFactory = new CoreFactory

    core = coreFactory.create()

    core.add('client/redis', '@superhero/core.redis/src/client')
    core.add('server', __dirname + '/../server')
    core.add('client', __dirname + '/../client')
    core.add('mapper', __dirname + '/../mapper')
    core.add('schema', __dirname + '/../schema')
    core.add('test', __dirname)

    core.load(true)

    core.locate('core/bootstrap').bootstrap().then(done)
  })

  after(async () =>
  {
    await core.locate('api/redis-subscriber').quit(),
    await core.locate('domain/process').quit(),
    await core.locate('eventsource/client').quit(),
    await core.locate('redis/client').quit()
    core.locate('core/eventbus').removeAllListeners()
  })

  const
    ppid    = Date.now().toString(32),
    pid     = Date.now().toString(36),
    domain  = 'test-domain',
    name    = 'test-event',
    data    = { test:pid }

  it('can write to, and read from, the eventsource system', function (done)
  {
    const
      client    = core.locate('eventsource/client'),
      mapper    = core.locate('eventsource/mapper'),
      session   = core.locate('redis/client').createSession(),
      channel   = mapper.toProcessPersistedChannel(domain, name)

    session.pubsub.subscribe(channel, async (dto) =>
    {
      const processState = await client.readState(domain, pid)
      context(this, { title:'context', value:{ domain, ppid, pid, name, data, dto, processState }})
      expect(processState).to.deep.equal(data)
      session.quit()
      done()
    })

    client.write({ domain, ppid, pid, name, data })
  })
})

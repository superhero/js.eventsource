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

  after(() =>
  {
    setTimeout(async() =>
    {
      await core.locate('api/redis-subscriber').quit(),
      await core.locate('domain/process').quit(),
      await core.locate('eventsource/client').quit(),
      await core.locate('redis/client').quit()
    },2e3)
  })

  const
    ppid    = Date.now().toString(32),
    pid     = Date.now().toString(36),
    domain  = 'test-domain',
    name    = 'test-event',
    data    = { test:pid }

  it('can write to the eventsource system and observe when a domain event was persisted', function (done)
  {
    const client = core.locate('eventsource/client')

    client.on(domain, name, async (dto) =>
    {
      const processState = await client.readState(domain, pid)
      context(this, { title:'context', value:{ domain, ppid, pid, name, data, dto, processState }})
      expect(processState).to.deep.equal(data)
      done()
    }).then(() => client.write({ domain, ppid, pid, name, data }))
  })

  it('can read the eventlog', async function ()
  {
    const
      client    = core.locate('eventsource/client'),
      eventlog  = await client.readEventlog(domain, pid)

    context(this, { title:'context', value:{ domain, pid, data, eventlog }})
    expect(eventlog).to.deep.equal([{ domain, ppid, pid, name, data }])
  })

  it('can read a process event', async function ()
  {
    const
      client    = core.locate('eventsource/client'),
      eventData = await client.readEvent(domain, pid, name)

    context(this, { title:'context', value:{ domain, pid, name, data, eventData }})
    expect(eventData).to.deep.equal(data)
  })

  it('can read if a process has a persisted event', async function ()
  {
    const
      client    = core.locate('eventsource/client'),
      hasEvent  = await client.hasEvent(domain, pid, name)

    context(this, { title:'context', value:{ domain, pid, name, data, hasEvent }})
    expect(hasEvent).to.equal(true)
  })

  it('can lazyload an existing process event', async function ()
  {
    const
      client    = core.locate('eventsource/client'),
      eventData = await client.lazyload(domain, pid, name, async () => 123)

    context(this, { title:'context', value:{ domain, pid, name, data, eventData }})
    expect(eventData).to.deep.equal(data)
  })

  it('can lazyload a none existing process event', async function ()
  {
    const
      client    = core.locate('eventsource/client'),
      eventData = await client.lazyload(domain, pid, 'foobar', async () => 123)

    context(this, { title:'context', value:{ domain, pid, name, data, eventData }})
    expect(eventData).to.equal(123)
  })
})

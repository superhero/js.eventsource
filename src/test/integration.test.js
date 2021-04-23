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
      await core.locate('redis/client').connection.quit()
    },2e3)
  })

  const
    ppid    = 'test-' + Date.now().toString(32),
    pid     = 'test-' + Date.now().toString(36),
    domain  = 'test-domain',
    name    = 'test-event',
    data    = { test:pid },
    event   = { domain, ppid, pid, name, data }

  beforeEach(function () 
  {
    context(this, { title:'process event', value:event })
  })

  it('consume when a domain event was persisted', function (done)
  {
    const client  = core.locate('eventsource/client')

    client.consume(domain, name, async (dto) =>
    {
      context(this, { title:'dto', value:dto })
      expect(dto.pid).to.equal(pid)
      done()
    }).then(() => client.write(event))
  })

  it('observe when a domain event was persisted', function (done)
  {
    const 
      client      = core.locate('eventsource/client'),
      channel     = name + '-subscribe',
      channelPid  = pid  + '-subscribe'

    client.subscribe(domain, channel, (dto) =>
    {
      context(this, { title:'dto', value:dto })
      expect(dto.pid).to.equal(channelPid)
      done()
    }).then(() => client.write({ ...event, name:channel, pid:channelPid }))
  })

  it('read the process state', async function ()
  {
    const 
      client        = core.locate('eventsource/client'),
      processState  = await client.readState(domain, pid)
    context(this, { title:'process state', value:processState })
    expect(processState).to.deep.equal(data)
  })

  it('read the eventlog', async function ()
  {
    const
      client    = core.locate('eventsource/client'),
      eventlog  = await client.readEventlog(domain, pid)
    context(this, { title:'eventlog', value:eventlog  })
    expect(eventlog).to.deep.equal([ event ])
  })

  it('read the event name index', async function ()
  {
    const
      client          = core.locate('eventsource/client'),
      eventNameIndex  = await client.readEventIndex(domain, name)
    context(this, { title:'event name index', value:eventNameIndex  })
    expect(eventNameIndex.length).to.be.gt(0)
  })

  it('read the event name index length', async function ()
  {
    const
      client                = core.locate('eventsource/client'),
      eventNameIndexLength  = await client.readEventIndexLength(domain, name)
    context(this, { title:'event name index length', value:eventNameIndexLength  })
    expect(eventNameIndexLength).to.be.gt(0)
  })

  it('read an process event', async function ()
  {
    const
      client    = core.locate('eventsource/client'),
      eventData = await client.readEvent(domain, pid, name)
    context(this, { title:'event data',  value:eventData })
    expect(eventData).to.deep.equal(data)
  })

  it('read if a process has a persisted event', async function ()
  {
    const
      client    = core.locate('eventsource/client'),
      hasEvent  = await client.hasEvent(domain, pid, name)
    context(this, { title:'has event', value:hasEvent  })
    expect(hasEvent).to.equal(true)
  })

  it('lazyload an existing process event', async function ()
  {
    const
      client    = core.locate('eventsource/client'),
      eventData = await client.lazyload(domain, pid, name, async () => 123)
    context(this, { title:'event data',  value:eventData })
    expect(eventData).to.deep.equal(data)
  })

  it('lazyload a none existing process event', async function ()
  {
    const
      client    = core.locate('eventsource/client'),
      eventData = await client.lazyload(domain, pid, 'foobar', async () => 123)
    context(this, { title:'event data',  value:eventData })
    expect(eventData).to.equal(123)
  })
})

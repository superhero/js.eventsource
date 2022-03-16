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

    core.locate('core/bootstrap').bootstrap().then(done).catch((error) => core.locate('core/console').log(error))
  })

  const
    timestamp = new Date().toJSON(),
    ppid      = 'test-' + Date.now().toString(32),
    pid       = 'test-' + Date.now().toString(36),
    domain    = 'test-domain',
    name      = 'test-event',
    data      = { test:pid },
    event     = { timestamp, domain, ppid, pid, name, data }

  beforeEach(function () 
  {
    context(this, { title:'process event', value:event })
  })

  after(() => core.locate('eventsource/client').quit())

  it('consume when a domain event was persisted', function (done)
  {
    const client = core.locate('eventsource/client')

    client.consume(domain, name, (dto) =>
    {
      context(this, { title:'dto', value:dto })
      expect(dto.pid).to.equal(pid)
      return new Promise((accept) => setTimeout(accept, 500))
    }).then(() => 
    {
      return client.consume(domain, name, (dto) =>
      {
        context(this, { title:'dto', value:dto })
        expect(dto.pid).to.equal(pid)
        done()
      }).then(() => client.write(event) && client.write(event))
    })
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
    try
    {
      const 
        client        = core.locate('eventsource/client'),
        processState  = await client.readState(domain, pid)
      context(this, { title:'process state', value:processState })
      expect(processState).to.deep.equal(data)
    }
    catch(error)
    {
      console.log(error)
      throw error
    }
  })

  it('read the eventlog', async function ()
  {
    const
      client    = core.locate('eventsource/client'),
      eventlog  = await client.readEventlog(domain, pid)
    context(this, { title:'eventlog', value:eventlog  })
    expect(eventlog).to.deep.equal([ event, event ])
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

  it('can schedule an event to be persisted in the future', function (done)
  {
    const
      client        = core.locate('eventsource/client'),
      scheduledPid  = pid   + '-scheduled',
      scheduledName = name  + '-scheduled',
      timestamp     = Date.now() + 250

    client.consume(domain, scheduledName, (dto) =>
    {
      context(this, { title:'dto', value:dto })
      expect(dto.pid).to.equal(scheduledPid)
      expect(dto.name).to.equal(scheduledName)
      expect(dto.data).to.deep.equal(data)
      done()
    }).then(() => client.schedule(timestamp, { domain, pid:scheduledPid, name:scheduledName, data }))
  })
})

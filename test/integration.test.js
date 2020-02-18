describe('integration test', () =>
{
  let core

  before((done) =>
  {
    const
    CoreFactory = require('superhero/core/factory'),
    coreFactory = new CoreFactory

    core = coreFactory.create()

    core.add('api')
    core.add('domain')
    core.add('infrastructure')

    core.load()

    core.locate('core/bootstrap').bootstrap().then(done)
  })

  after(() =>
  {
    core.locate('repository/redis').gateway.close()
    core.locate('repository/mysql').gateway.close()
  })

  it('can send a "persist" message to store information in the system', (done) =>
  {
    const
    redis     = core.locate('repository/redis'),
    composer  = core.locate('core/schema/composer'),
    eventbus  = core.locate('core/eventbus'),
    channel   = 'test-persist-channel',
    query     =
    {
      '$insert':
      {
        '$documents':
        {
          'pid'     : 'test-id',
          'domain'  : 'test-domain',
          'name'    : 'test-event',
          'data'    :
          {
            'foo' : 'bar',
            'baz' : 'qux'
          }
        }
      }
    },
    event = composer.compose('event/requested-to-persist', { channel, query })

    redis.subscribe(channel)
    eventbus.on(channel, (data) => data === 'end' && done())
    redis.publish('persist', event)
  })

  it('can send a "fetch" message to query for information', (done) =>
  {
    const
    redis     = core.locate('repository/redis'),
    composer  = core.locate('core/schema/composer'),
    eventbus  = core.locate('core/eventbus'),
    channel   = 'test-fetch-channel',
    query     =
    {
      '$select':
      {
        '$where':
        {
          'pid' : 'test-id'
        }
      }
    },
    event = composer.compose('event/requested-to-fetch', { channel, query })

    redis.subscribe(channel)
    eventbus.on(channel, (data) => data === 'end' && done())
    redis.publish('fetch', event)
  })
})

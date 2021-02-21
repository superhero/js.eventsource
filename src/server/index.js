const
  CoreFactory = require('superhero/core/factory'),
  coreFactory = new CoreFactory,
  core        = coreFactory.create()

core.add('eventsource', __dirname)
core.add('client/redis', '@superhero/core.redis/src/client')
core.add('mapper', __dirname + '/../mapper')
core.add('schema', __dirname + '/../schema')

core.load()

core.locate('core/bootstrap').bootstrap()

const
  CoreFactory = require('superhero/core/factory'),
  coreFactory = new CoreFactory,
  core        = coreFactory.create()

core.add('api')
core.add('domain')
core.add('client/redis', '@superhero/core.redis/src/client')
core.add('mapper', __dirname + '/../mapper')
core.add('schema', __dirname + '/../schema')
core.add('infrastructure')

core.load()

core.locate('core/bootstrap').bootstrap()

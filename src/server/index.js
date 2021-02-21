const
  CoreFactory = require('superhero/core/factory'),
  coreFactory = new CoreFactory,
  core        = coreFactory.create()

core.add('client/redis', '@superhero/core.redis/src/client')
core.add('server', __dirname)
core.add('mapper', __dirname + '/../mapper')
core.add('schema', __dirname + '/../schema')

core.load()

core.locate('core/bootstrap').bootstrap()

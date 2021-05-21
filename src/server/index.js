const
  CoreFactory = require('superhero/core/factory'),
  coreFactory = new CoreFactory,
  core        = coreFactory.create()

core.add('client/redis', '@superhero/core.redis/src/client')
core.add('server')
core.add('client')
core.add('mapper')
core.add('schema')
core.add('test', __dirname)

core.load()

core.locate('core/bootstrap').bootstrap()

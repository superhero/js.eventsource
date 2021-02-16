const
  CoreFactory = require('superhero/core/factory'),
  coreFactory = new CoreFactory,
  core        = coreFactory.create()

core.add('api')
core.add('domain')
core.add('infrastructure')
core.add('schema', __dirname + '/../schema')

core.load()

core.locate('core/bootstrap').bootstrap()
const
  CoreFactory = require('superhero/core/factory'),
  coreFactory = new CoreFactory,
  core        = coreFactory.create()

core.add('api')
core.add('domain')
core.add('infrastructure')

core.load()

core.locate('core/bootstrap').bootstrap()

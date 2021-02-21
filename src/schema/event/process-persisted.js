/**
 * @memberof Eventsource.Schema
 * @typedef {Object} EventProcessPersisted
 */
const schema =
{
  '@meta': 
  {
    'extends' : 'eventsource/schema/value/process-meta',
    'exclude' : 
    [
      'ppid',
      'name',
      'domain'
    ]
  }
}

module.exports = schema

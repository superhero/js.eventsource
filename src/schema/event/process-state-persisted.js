/**
 * @memberof Eventsource.Schema
 * @typedef {Object} EventProcessStatePersisted
 */
const schema =
{
  '@meta': 
  {
    'extends' : 'eventsource/schema/value/process-state-meta',
    'exclude' : 'ppid'
  }
}

module.exports = schema

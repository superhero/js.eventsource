/**
 * @memberof Eventsource.Schema
 * @typedef {Object} EntityProcessState
 */
const schema =
{
  '@meta': 
  {
    'extends' : 'eventsource/schema/value/process-state-meta'
  },
  'data':
  {
    'type'    : 'json'
  }
}

module.exports = schema

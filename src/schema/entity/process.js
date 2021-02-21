/**
 * @memberof Eventsource.Schema
 * @typedef {Object} EntityProcess
 */
const schema =
{
  '@meta': 
  {
    'extends' : 'eventsource/schema/value/process-meta'
  },
  'data':
  {
    'type'    : 'json'
  }
}

module.exports = schema

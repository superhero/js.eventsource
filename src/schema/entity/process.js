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
    'type'    : 'json',
    'default' : {}
  }
}

module.exports = schema

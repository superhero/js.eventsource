/**
 * @memberof Eventsource.Schema
 * @typedef {Object} EventRequestedToPersist
 */
const schema =
{
  'channel':
  {
    'type'        : 'string',
    'description' : 'the channel which will be used to respond with the resulting data',
    'not-empty'   : true
  },
  'query':
  {
    'type'        : 'schema',
    'schema'      : 'eventsource/shema/value/query-persist'
  }
}

module.exports = schema

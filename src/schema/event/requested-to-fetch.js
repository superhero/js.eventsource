/**
 * @memberof Eventsource.Schema
 * @typedef {Object} EventRequestedToFetch
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
    'schema'      : 'eventsource/shema/value/query-fetch'
  }
}

module.exports = schema

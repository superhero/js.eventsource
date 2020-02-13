/**
 * @memberof Domain
 * @typedef {Object} SchemaEventRequestedToFetch
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
    'schema'      : 'value-object/query-fetch'
  }
}

module.exports = schema

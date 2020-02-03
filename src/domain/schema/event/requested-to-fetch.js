/**
 * @memberof Domain
 * @typedef {Object} SchemaEventRequestedToFetch
 */
const schema =
{
  'channel':
  {
    'type'      : 'string',
    'not-empty' : true
  },
  'query':
  {
    'type'      : 'schema',
    'schema'    : 'value-object/query-fetch'
  }
}

module.exports = schema

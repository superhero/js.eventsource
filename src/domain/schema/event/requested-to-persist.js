/**
 * @memberof Domain
 * @typedef {Object} SchemaEventRequestedToPersist
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
    'schema'    : 'value-object/query-persist'
  }
}

module.exports = schema

/**
 * @memberof Domain
 * @typedef {Object} SchemaEventRequestedToPersist
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
    'schema'      : 'value-object/query-persist'
  }
}

module.exports = schema

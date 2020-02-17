/**
 * @memberof Domain
 * @typedef {Object} SchemaValueObjectQueryPersistInsert
 */
const schema =
{
  '$table':
  {
    'type'    : 'string',
    'default' : 'eventsource.event'
  },
  '$documents':
  {
    'type'    : 'schema',
    'schema'  : 'value-object/query-persist-insert-documents'
  }
}

module.exports = schema

/**
 * @memberof Eventsource.Schema
 * @typedef {Object} ValueQueryPersistInsert
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
    'schema'  : 'eventsource/shema/value/query-persist-insert-documents'
  }
}

module.exports = schema

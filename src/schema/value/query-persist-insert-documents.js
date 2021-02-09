/**
 * @memberof Domain
 * @typedef {Object} SchemaValueObjectQueryPersistInsertDocuments
 */
const schema =
{
  /*
  'timestamp':
  {
    'type'        : 'timestamp',
    'optional'    : true
  },
  */
  'pid':
  {
    'type'        : 'string',
    'not-empty'   : true
  },
  'domain':
  {
    'type'        : 'string',
    'not-empty'   : true
  },
  'name':
  {
    'type'        : 'string',
    'not-empty'   : true
  },
  'data':
  {
    'type'        : 'json',
    'stringified' : true
  }
}

module.exports = schema

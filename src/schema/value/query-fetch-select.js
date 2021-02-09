/**
 * @see https://github.com/planetarydev/json-sql-builder2/tree/master/sql/operators/select
 * @memberof Domain
 * @typedef {Object} SchemaValueObjectQueryFetchSelect
 */
const schema =
{
  '$columns':
  {
    'type'        : 'string',
    'collection'  : true,
    'optional'    : true
  },
  '$distinct':
  {
    'type'        : 'boolean',
    'optional'    : true
  },
  '$from':
  {
    'type'        : 'string',
    'default'     : 'eventsource.event'
  },
  '$where':
  {
    'type'        : 'json',
    'stringified' : false
  },
  '$groupBy': 
  {
    'type'        : 'json',
    'stringified' : false,
    'optional'    : true
  },
  '$having': 
  {
    'type'        : 'json',
    'stringified' : false,
    'optional'    : true
  },
  // https://github.com/planetarydev/json-sql-builder2/tree/master/sql/helpers/queries/join
  '$join': 
  {
    'type'        : 'json',
    'stringified' : false,
    'optional'    : true
  },
  '$orderBy': 
  {
    'type'        : 'json',
    'stringified' : false,
    'optional'    : true
  },
  '$limit':
  {
    'type'        : 'integer',
    'optional'    : true
  },
  '$offset':
  {
    'type'        : 'integer',
    'optional'    : true
  }
}

module.exports = schema

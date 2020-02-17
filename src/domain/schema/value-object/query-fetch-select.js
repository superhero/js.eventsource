/**
 * @memberof Domain
 * @typedef {Object} SchemaValueObjectQueryFetchSelect
 */
const schema =
{
  /*
  '$columns':
  {
    'type'      : 'json',
    'optional'  : true
  },
  */
  '$from':
  {
    'type'      : 'string',
    'default'   : 'eventsource.event'
  },
  '$where':
  {
    'type'        : 'json',
    'stringified' : false
  }
}

module.exports = schema

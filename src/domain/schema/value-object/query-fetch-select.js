/**
 * @memberof Domain
 * @typedef {Object} SchemaValueObjectQueryFetchSelect
 */
const schema =
{
  '$columns':
  {
    'type'      : 'object',
    'optional'  : true
  },
  '$from':
  {
    'type'      : 'string',
    'default'   : 'eventsource.event',
    'enum'      :
    [
      'eventsource.event'
    ]
  },
  '$where':
  {
    'type'      : 'object'
  },
}

module.exports = schema

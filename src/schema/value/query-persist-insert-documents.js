/**
 * @memberof Eventsource.Schema
 * @typedef {Object} ValueQueryPersistInsertDocuments
 */
const schema =
{
  'ppid':
  {
    'type'        : 'string',
    'not-empty'   : true,
    'max'         : 200
  },
  'pid':
  {
    'type'        : 'string',
    'not-empty'   : true,
    'max'         : 200
  },
  'domain':
  {
    'type'        : 'string',
    'not-empty'   : true,
    'max'         : 200
  },
  'name':
  {
    'type'        : 'string',
    'not-empty'   : true,
    'max'         : 200
  },
  'data':
  {
    'type'        : 'json',
    'stringified' : true
  }
}

module.exports = schema

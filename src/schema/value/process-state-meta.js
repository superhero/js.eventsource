/**
 * @memberof Eventsource.Schema
 * @typedef {Object} ValueProcessStateMeta
 */
const schema =
{
  'domain':
  {
    'type'      : 'string',
    'not-empty' : true
  },
  'pid':
  {
    'type'      : 'string',
    'not-empty' : true
  },
  'ppid':
  {
    'type'      : 'string',
    'not-empty' : true,
    'optional'  : true
  },
  'name':
  {
    'type'      : 'string',
    'not-empty' : true
  }
}

module.exports = schema

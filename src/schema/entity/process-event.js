/**
 * @memberof Eventsource.Schema
 * @typedef {Object} EntityProcessEvent
 */
const schema =
{
  'timestamp':
  {
    'type'      : 'timestamp',
  },
  'ppid':
  {
    'type'      : 'string',
    'not-empty' : true,
    'optional'  : true
  },
  'pid':
  {
    'type'      : 'string',
    'not-empty' : true
  },
  'domain':
  {
    'type'      : 'string',
    'not-empty' : true
  },
  'name':
  {
    'type'      : 'string',
    'not-empty' : true
  },
  'data':
  {
    'type'      : 'json'
  }
}

module.exports = schema

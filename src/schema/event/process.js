/**
 * @memberof Eventsource.Schema
 * @typedef {Object} EventProcess
 */
const schema =
{
  '@meta': 
  {
    'extends'   : 'eventsource/schema/entity/process'
  },
  'id':
  {
    'type'      : 'string',
    'not-empty' : true
  }
}

module.exports = schema

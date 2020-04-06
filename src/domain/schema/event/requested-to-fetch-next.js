/**
 * @memberof Domain
 * @typedef {Object} SchemaEventRequestedToFetchNext
 */
const schema =
{
  'channel':
  {
    'type'        : 'string',
    'description' : 'the channel which will be used to respond with the resulting data',
    'not-empty'   : true
  }
}

module.exports = schema

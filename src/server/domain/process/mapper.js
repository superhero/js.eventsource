/**
 * @memberof Eventsource.Server.Domain
 * @extends {superhero/core/locator/constituent}
 */
class ProcessMapper
{
  constructor(schema)
  {
    this.schema = schema
  }

  async toEvent(msg)
  {
    return this.schema.compose('eventsource/shema/entity/process-event', msg)
  }
}

module.exports = ProcessMapper

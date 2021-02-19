/**
 * @memberof Eventsource.Mapper
 */
class EventsourceMapper
{
  constructor(schema)
  {
    this.schema = schema
  }

  toEntityProcessState(msg)
  {
    return this.schema.compose('eventsource/schema/entity/process-state', msg)
  }

  toEventProcessStatePersisted(msg)
  {
    return this.schema.compose('eventsource/schema/event/process-state-persisted', msg)
  }

  toProcessStateKey(domain, pid)
  {
    return `ps.${domain}.${pid}`
  }
}

module.exports = EventsourceMapper

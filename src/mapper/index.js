/**
 * @memberof Eventsource.Mapper
 */
class EventsourceMapper
{
  constructor(schema)
  {
    this.schema = schema
  }

  toEntityProcess(msg)
  {
    return this.schema.compose('eventsource/schema/entity/process', msg)
  }

  toEventProcessPersisted(msg)
  {
    return this.schema.compose('eventsource/schema/event/process-persisted', msg)
  }

  toProcessStateKey(domain, pid)
  {
    return `ps.${domain}.${pid}`
  }

  toProcessEventsKey(domain, pid)
  {
    return `pe.${domain}.${pid}`
  }

  toProcessPersistedChannel(domain, name)
  {
    return `process-${domain}-${name}-persisted`
  }
}

module.exports = EventsourceMapper

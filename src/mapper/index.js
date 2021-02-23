/**
 * @memberof Eventsource.Mapper
 */
class EventsourceMapper
{
  constructor(schema, string)
  {
    this.schema = schema
    this.string = string
  }

  toEntityProcess(msg)
  {
    return this.schema.compose('eventsource/schema/entity/process', msg)
  }

  toEventProcessPersisted(msg)
  {
    return this.schema.compose('eventsource/schema/event/process-persisted', msg)
  }

  toProcessEventQueuedChannel()
  {
    return 'process-event-queued'
  }

  toProcessErrorQueuedChannel()
  {
    return 'process-error-queued'
  }

  toProcessStateKey(domain, pid)
  {
    domain = this.string.composeSeperatedLowerCase(domain)
    return `ps.${domain}.${pid}`
  }

  toProcessEventsKey(domain, pid)
  {
    domain = this.string.composeSeperatedLowerCase(domain)
    return `pe.${domain}.${pid}`
  }

  toProcessHistoryKey(domain, pid)
  {
    domain = this.string.composeSeperatedLowerCase(domain)
    return `ph.${domain}.${pid}`
  }

  toProcessPersistedChannel(domain, name)
  {
    domain = this.string.composeSeperatedLowerCase(domain)
    name   = this.string.composeSeperatedLowerCase(name)

    return `process-${domain}-${name}-persisted`
  }

  toProcessConsumerErrorChannel(domain, name)
  {
    domain = this.string.composeSeperatedLowerCase(domain)
    name   = this.string.composeSeperatedLowerCase(name)

    return `process-${domain}-${name}-error`
  }
}

module.exports = EventsourceMapper

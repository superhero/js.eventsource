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

  toProcessId()
  {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
  }

  toEntityProcess(msg, immutable)
  {
    const timestamp = msg.timestamp || new Date().toJSON()
    return this.schema.compose('eventsource/schema/entity/process', { ...msg, timestamp }, immutable)
  }

  toScore(timestamp)
  {
    return new Date(timestamp).getTime()
  }

  toProcessStateKey(domain, pid)
  {
    domain = this.toSeperatedLowerCase(domain)
    return `ps:${domain}:${pid}`
  }

  toProcessHistoryKey(domain, pid)
  {
    domain = this.toSeperatedLowerCase(domain)
    return `ph:${domain}:${pid}`
  }

  toProcessEventQueuedChannel()
  {
    return 'process-event-queued'
  }

  toProcessErrorQueuedChannel()
  {
    return 'process-error-queued'
  }
  
  toProcessEventScheduledKey()
  {
    return 'process-event-scheduled'
  }

  toProcessErrorScheduledChannel()
  {
    return 'process-error-scheduled'
  }

  toProcessPersistedChannel(domain, name)
  {
    domain = this.toSeperatedLowerCase(domain)
    name   = this.toSeperatedLowerCase(name)

    return `process-${domain}-${name}-persisted`
  }

  toProcessConsumerErrorChannel(domain)
  {
    domain = this.toSeperatedLowerCase(domain)

    return `process-${domain}-error`
  }

  toSeperatedLowerCase(s)
  {
    return s.replace(/(?:(?!\*)(?![\w]).)+/g, '-').toLowerCase()
  }
}

module.exports = EventsourceMapper

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

  toEntityProcess(msg)
  {
    const timestamp = msg.timestamp || new Date().toJSON()
    return this.schema.compose('eventsource/schema/entity/process', { ...msg, timestamp })
  }

  toScore(timestamp)
  {
    return new Date(timestamp).getTime()
  }

  toProcessStateKey(domain, pid)
  {
    domain = this.string.composeSeperatedLowerCase(domain)
    return `ps:${domain}:${pid}`
  }

  toProcessHistoryKey(domain, pid)
  {
    domain = this.string.composeSeperatedLowerCase(domain)
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

  toProcessPersistedChannel(domain, name)
  {
    domain = this.string.composeSeperatedLowerCase(domain)
    name   = this.string.composeSeperatedLowerCase(name)

    return `process-${domain}-${name}-persisted`
  }

  toProcessConsumerErrorChannel(domain)
  {
    domain = this.string.composeSeperatedLowerCase(domain)

    return `process-${domain}-error`
  }
}

module.exports = EventsourceMapper

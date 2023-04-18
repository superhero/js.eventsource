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

  toQueryProcess(msg, immutable)
  {
    const timestamp = msg.timestamp || new Date().toJSON()
    return this.schema.compose('eventsource/schema/query/process', { ...msg, timestamp }, immutable)
  }

  toEventProcess(msg, immutable)
  {
    return this.schema.compose('eventsource/schema/event/process', msg, immutable)
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

  toProcessDataKey()
  {
    return `pd`
  }

  toProcessHistoryKey(domain, pid)
  {
    domain = this.toSeperatedLowerCase(domain)
    return `ph:${domain}:${pid}`
  }

  toProcessHistoryKeyIndexedByName(domain, pid, name)
  {
    domain = this.toSeperatedLowerCase(domain)
    return `phn:${domain}:${pid}:${name}`
  }

  toProcessHistoryKeyIndexedOnlyByName(name)
  {
    return `phon:${name}`
  }

  toProcessHistoryKeyIndexedOnlyByPid(pid)
  {
    return `phop:${pid}`
  }

  toProcessHistoryKeyIndexedOnlyByPpid(ppid)
  {
    return `phopp:${ppid}`
  }

  toProcessHistoryKeyIndexedByPpid(domain, ppid)
  {
    return `phpp:${domain}:${ppid}`
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

  toProcessPersistedPidChannel(domain, pid)
  {
    domain = this.toSeperatedLowerCase(domain)
    return `process-${domain}-${pid}-persisted-pid`
  }

  toProcessPersistedPidNameChannel(domain, pid, name)
  {
    domain = this.toSeperatedLowerCase(domain)
    return `process-${domain}-${pid}-${name}-persisted-pid-name`
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

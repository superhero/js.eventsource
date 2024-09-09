/**
 * @memberof Eventsource.Server
 * @extends {superhero/core/locator/constituent}
 */
class Reader
{
  constructor(redis, mapper, deepmerge)
  {
    this.redis      = redis
    this.mapper     = mapper
    this.deepmerge  = deepmerge
  }

  /**
   * @param {string} domain
   * @param {string} pid process id
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventlog(domain, pid, from, to, immutable)
  {
    const
      phKey     = this.mapper.toProcessHistoryKey(domain, pid),
      scoreFrom = from  && this.mapper.toScore(from),
      scoreTo   = to    && this.mapper.toScore(to),
      history   = await this.redis.ordered.read(phKey, scoreFrom, scoreTo),
      eventlog  = await Promise.all(history.map((id) => this.readEventById(id))),
      filtered  = eventlog.map((event) => this.mapper.toEventProcess(event, immutable))

    return filtered
  }

  /**
   * This function requires a migration of old data before 3.0.0 release.
   * 
   * @param {string} pid process id
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventlogByPid(pid, from, to, immutable)
  {
    const
      phpKey    = this.mapper.toProcessHistoryKeyIndexedOnlyByPid(pid),
      scoreFrom = from  && this.mapper.toScore(from),
      scoreTo   = to    && this.mapper.toScore(to),
      history   = await this.redis.ordered.read(phpKey, scoreFrom, scoreTo),
      eventlog  = await Promise.all(history.map((id) => this.readEventById(id))),
      filtered  = eventlog.map((event) => this.mapper.toEventProcess(event, immutable))

    return filtered
  }

  /**
   * This function requires a migration of old data before 3.4.X release.
   * 
   * @param {string} ppid parent process id
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventlogByPpid(ppid, from, to, immutable)
  {
    const
      phoppKey  = this.mapper.toProcessHistoryKeyIndexedOnlyByPpid(ppid),
      scoreFrom = from  && this.mapper.toScore(from),
      scoreTo   = to    && this.mapper.toScore(to),
      history   = await this.redis.ordered.read(phoppKey, scoreFrom, scoreTo),
      eventlog  = await Promise.all(history.map((id) => this.readEventById(id))),
      filtered  = eventlog.map((event) => this.mapper.toEventProcess(event, immutable))

    return filtered
  }

  /**
   * This function requires a migration of old data before 3.4.X release.
   * 
   * @param {string} domain process name
   * @param {string} ppid parent process id
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventlogByDomainAndPpid(domain, ppid, from, to, immutable)
  {
    const
      phppKey   = this.mapper.toProcessHistoryKeyIndexedByPpid(domain, ppid),
      scoreFrom = from  && this.mapper.toScore(from),
      scoreTo   = to    && this.mapper.toScore(to),
      history   = await this.redis.ordered.read(phppKey, scoreFrom, scoreTo),
      eventlog  = await Promise.all(history.map((id) => this.readEventById(id))),
      filtered  = eventlog.map((event) => this.mapper.toEventProcess(event, immutable))

    return filtered
  }

  /**
   * This function requires a migration of old data before use. The migration script is 
   * expected to be included in future 3.0.0 release.
   * 
   * @param {string} name name of the event
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventWrittenByAllProcesses(name, from, to, immutable)
  {
    const
      phonKey   = this.mapper.toProcessHistoryKeyIndexedOnlyByName(name),
      scoreFrom = from  && this.mapper.toScore(from),
      scoreTo   = to    && this.mapper.toScore(to),
      history   = await this.redis.ordered.read(phonKey, scoreFrom, scoreTo),
      eventlog  = await Promise.all(history.map((id) => this.readEventById(id))),
      filtered  = eventlog.filter((event) => { try{ this.mapper.toEventProcess(event, immutable) } catch(e) { return false } return true }),
      mapped    = filtered.map((event) => this.mapper.toEventProcess(event, immutable))

    return mapped
  }

  /**
   * @param {string} domain
   * @param {string} pid process id
   * @param {string} name event name
   * @param {string} [from] timestamp
   * @param {string} [to] timestamp
   * @param {boolean} [immutable] if the returned colelction should be immutable or not
   */
  async readEventlogByEventName(domain, pid, name, from, to, immutable)
  {
    const
      phnKey    = this.mapper.toProcessHistoryKeyIndexedByName(domain, pid, name),
      scoreFrom = from  && this.mapper.toScore(from),
      scoreTo   = to    && this.mapper.toScore(to),
      history   = await this.redis.ordered.read(phnKey, scoreFrom, scoreTo),
      eventlog  = await Promise.all(history.map((id) => this.readEventById(id))),
      filtered  = eventlog.map((event) => this.mapper.toEventProcess(event, immutable))

    return filtered
  }

  async readState(domain, pid, from=null, to=null, immutable=false)
  {
    const
      eventlog  = await this.readEventlog(domain, pid, from, to, immutable),
      state     = {}

    // divided in segments of 10... to prevent call stack issues with larger eventlogs
    for(let i = 0; i < eventlog.length; i++)
    {
      if(i && i % 10 === 0)
      {
        const segment = this.deepmerge.merge(...eventlog.slice(i - 10, i).map((event) => event.data))
        this.deepmerge.merge(state, segment)
      }
      else if(i === eventlog.length - 1)
      {
        const segment = this.deepmerge.merge(...eventlog.slice(i - (i % 10), i + 1).map((event) => event.data))
        this.deepmerge.merge(state, segment)
      }
    }

    return state
  }

  /**
   * @param {string} domain
   * @param {string} pid
   * @param {string} name
   * @param {string} [timestamp] optional, will pop the last event persisted if omitted
   */
  async readEvent(domain, pid, name, timestamp)
  {
    const
      eventlog  = await this.readEventlog(domain, pid, timestamp, timestamp),
      filtered  = eventlog.filter((event) => event.name === name)

    return filtered.pop().data
  }

  /**
   * @param {number} id
   */
  async readEventById(id)
  {
    const 
      pdKey = this.mapper.toProcessDataKey(),
      event = await this.redis.hash.read(pdKey, id),
      eid   = await this.readEid(id),
      cpid  = await this.readCpid(id)

    if(event)
    {
      return { ...event, eid, cpid, id }
    }
    // backwards compatibility...
    else
    {
      const 
        channel     = this.mapper.toProcessEventQueuedChannel(),
        streamEvent = await this.redis.stream.read(channel, id)

      return { ...streamEvent, eid, cpid, id }
    }
  }

  async readEid(id)
  {
    const phoeKey = this.mapper.toProcessHistoryKeyIndexedOnlyByEid(id)
    await this.redis.unordered.read(phoeKey)
  }

  async readCpid(id)
  {
    const phocpKey = this.mapper.toProcessHistoryKeyIndexedOnlyByCpid(id)
    await this.redis.unordered.read(phocpKey)
  }

  /**
   * @param {string} domain 
   * @param {string} pid 
   * @param {string} name 
   */
  async hasEvent(domain, pid, name)
  {
    const eventlog = await this.readEventlogByEventName(domain, pid, name)
    return eventlog.length > 0
  }
}

module.exports = Reader

/**
 * @memberof Eventsource.Server
 * @extends {superhero/core/locator/constituent}
 */
class Writer
{
  constructor(redis, mapper, deepmerge, reader)
  {
    this.redis      = redis
    this.mapper     = mapper
    this.deepmerge  = deepmerge
    this.reader     = reader
  }

  /**
   * @param {number} id 
   * @param {Eventsource.Schema.EntityProcess } process 
   * @param {boolean} broadcast not used, but possible to use for any alternative implementation
   */
  async indexProcess(id, process)
  {
    const
      { timestamp, domain, pid, eid, ppid, cpid, name } = process,
      pdKey           = this.mapper.toProcessDataKey(),
      phKey           = this.mapper.toProcessHistoryKey(domain, pid),
      phonKey         = this.mapper.toProcessHistoryKeyIndexedOnlyByName(name),
      phopKey         = this.mapper.toProcessHistoryKeyIndexedOnlyByPid(pid),
      phnKey          = this.mapper.toProcessHistoryKeyIndexedByName(domain, pid, name),
      queuedChannel   = this.mapper.toProcessEventQueuedChannel(),
      indexedChannel  = this.mapper.toProcessEventIndexedChannel(),
      score           = this.mapper.toScore(timestamp)

    delete process.eid
    delete process.cpid

    await this.redis.hash.write(pdKey, id, process)
    await this.redis.ordered.write(phKey,   id, score)
    await this.redis.ordered.write(phnKey,  id, score)
    await this.redis.ordered.write(phonKey, id, score)
    await this.redis.ordered.write(phopKey, id, score)

    if(eid)
    {
      await this.linkEid(id, eid)
    }

    if(cpid)
    {
      await this.linkCpid(id, cpid)
    }

    if(ppid)
    {
      const
        phoppKey  = this.mapper.toProcessHistoryKeyIndexedOnlyByPpid(ppid),
        phppKey   = this.mapper.toProcessHistoryKeyIndexedByPpid(domain, ppid)

      await this.redis.ordered.write(phoppKey, id, score)
      await this.redis.ordered.write(phppKey,  id, score)
    }

    await this.redis.stream.delete(queuedChannel, id)
    await this.redis.stream.write(indexedChannel, { id })
  }

  async linkEid(id, eid)
  {
    eid = Array.isArray(eid) ? eid : [eid]

    const phoeKey = this.mapper.toProcessHistoryKeyIndexedOnlyByEid(id)

    for(const item of eid)
    {
      await this.redis.unordered.write(phoeKey, item)
    }
  }

  async linkCpid(id, cpid)
  {
    cpid = Array.isArray(cpid) ? cpid : [cpid]

    const phocpKey = this.mapper.toProcessHistoryKeyIndexedOnlyByCpid(id)

    for(const item of cpid)
    {
      await this.redis.unordered.write(phocpKey, item)
    }
  }

  async unlinkEid(id, eid)
  {
    eid = Array.isArray(eid) ? eid : [eid]

    const phoeKey = this.mapper.toProcessHistoryKeyIndexedOnlyByEid(id)

    for(const item of cpid)
    {
      await this.redis.unordered.deleteValue(phoeKey, item)
    }
  }

  async unlinkCpid(id, cpid)
  {
    cpid = Array.isArray(cpid) ? cpid : [cpid]

    const phocpKey = this.mapper.toProcessHistoryKeyIndexedOnlyByCpid(id)

    for(const item of cpid)
    {
      await this.redis.unordered.deleteValue(phocpKey, item)
    }
  }

  /**
   * @param {string} id
   */
  async deleteIndexedProcess(id)
  {
    const
      process         = await this.reader.readEventById(id),
      { domain, pid, ppid, name } = process,
      pdKey           = this.mapper.toProcessDataKey(),
      phKey           = this.mapper.toProcessHistoryKey(domain, pid),
      phonKey         = this.mapper.toProcessHistoryKeyIndexedOnlyByName(name),
      phopKey         = this.mapper.toProcessHistoryKeyIndexedOnlyByPid(pid),
      phoeKey         = this.mapper.toProcessHistoryKeyIndexedOnlyByEid(id),
      phocpKey        = this.mapper.toProcessHistoryKeyIndexedOnlyByCpid(id),
      phnKey          = this.mapper.toProcessHistoryKeyIndexedByName(domain, pid, name),
      queuedChannel   = this.mapper.toProcessEventQueuedChannel(),
      indexedChannel  = this.mapper.toProcessEventIndexedChannel()

    await this.redis.ordered.deleteValue(phKey,   id)
    await this.redis.ordered.deleteValue(phnKey,  id)
    await this.redis.ordered.deleteValue(phonKey, id)
    await this.redis.ordered.deleteValue(phopKey, id)

    await this.redis.unordered.delete(phoeKey)
    await this.redis.unordered.delete(phocpKey)

    if(ppid)
    {
      const
        phoppKey  = this.mapper.toProcessHistoryKeyIndexedOnlyByPpid(ppid),
        phppKey   = this.mapper.toProcessHistoryKeyIndexedByPpid(domain, ppid)

      await this.redis.ordered.deleteValue(phoppKey,  id)
      await this.redis.ordered.deleteValue(phppKey,   id)
    }

    await this.redis.stream.delete(queuedChannel,   id)
    await this.redis.stream.delete(indexedChannel,  id)

    await this.redis.hash.delete(pdKey, id)
  }

  /**
   * @param {string} domain
   * @param {string} pid
   * @param {string} name
   */
  async deleteIndexedProcessByName(domain, pid, name)
  {
    // TODO - read with help of read model
    const
      phnKey      = this.mapper.toProcessHistoryKeyIndexedByName(domain, pid, name),
      collection  = await this.redis.ordered.read(phnKey)

    for(const id of collection)
    {
      await this.deleteIndexedProcess(id)
    }
  }

  /**
   * @param {Eventsource.Schema.EntityProcess} input 
   * @param {Eventsource.Schema.EntityProcess} [chain] the event that preceeded 
   * the event now being written, used to be extended by the input entity and set 
   * the referer id called "rid" in the meta value object, extended by the 
   * process entity.
   * @param {boolean} [broadcast=true] 
   */
  async writeEvent(publisher, input, chain, broadcast=true)
  {
    if(chain)
    {
      input = this.deepmerge.merge(
      {
        rid     : chain.id, 
        domain  : chain.domain, 
        pid     : chain.pid, 
        ppid    : chain.ppid, 
        name    : chain.name 
      }, input)
    }

    const
      channel = this.mapper.toProcessEventQueuedChannel(),
      process = this.mapper.toQueryProcess(input)

    await this.redis.stream.lazyloadConsumerGroup(channel, channel)
    const response = await this.redis.stream.write(channel, { ...process, broadcast })
    publisher.pubsub.publish(channel)

    return response
  }

  /**
   * @param {string|number} timestamp value representing the time when the event should be persisted
   * @param {Eventsource.Schema.EntityProcess} input 
   * @param {Eventsource.Schema.EntityProcess} [chain] the event that preceeded 
   * the event now being written, used to be extended by the input entity and set 
   * the referer id called "rid" in the meta value object, extended by the 
   * process entity.
   */
  async schedule(publisher, timestamp, input, chain)
  {
    if(chain)
    {
      input = this.deepmerge.merge(
      {
        rid     : chain.id,
        domain  : chain.domain,
        pid     : chain.pid,
        ppid    : chain.ppid,
        name    : chain.name
      }, input)
    }

    const
      scheduledKey        = this.mapper.toProcessEventScheduledKey(),
      scheduledKeyChannel = this.mapper.toProcessEventScheduledKeyChannel(),
      scheduledScore      = new Date(timestamp).getTime(),
      process             = this.mapper.toQueryProcess(input)

    await this.redis.ordered.write(scheduledKey, process, scheduledScore)
    publisher.pubsub.publish(scheduledKeyChannel, scheduledScore)
  }

  async clearSchedule(publisher, min='-inf', max='+inf')
  {
    const scheduledKey = this.mapper.toProcessEventScheduledKey()
    await this.redis.ordered.delete(scheduledKey, min, max)
    publisher.pubsub.publish('process-event-scheduled-cleared')
  }
}

module.exports = Writer

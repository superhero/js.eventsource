3.1.0
- Added chain ability to the `client.schedule` function, to chain one event to a previous one as explained in changelog 3.0.0 describing changes for `client.write`.

3.0.0
- Added a migration script for the old data to be indexed correlated with the new versions index. If you have old data written using an older version of this library, then the same functionality is still expected to work, but the newly intruduced functionality will not; for that reason it's recomeded to migrate the data. The script is written to ensure that curruption will not take place, even if you run the script multiple times. But as usally, you should always take a backup of your data before running this script.
- Added the schemas `QueryProcess` and `EventProcess`, where the `EventProcess` includes the stream ID.
- Added the optional `rid` attribute (short for reference id) to the `ValueProcessMeta` schema. The attributre is intended to be used to refer to the precending event, useful if analysing a multi-threaded eventlog.
- Changed interface of the `client.write` function, from `client.write(input, broadcast=true)` to `client.write(input, [chain], broadcast=true)`, to be able to chain the previous event with the new one.
- Changed anme of the `mapper.toEntityProcess` function to `mapper.toQueryProcess`.
- Added function `mapper.toEventProcess`, difference from the `mapper.toQueryProcess` being that the event is returned after peristed, and is expected to include the ID in the returned DTO.
- Added `client.readEventlogByPid(pid, [from], [to], [immutable])`, allows to read the eventlog without providing the domain name.
- Added `client.readEventWrittenByAllProcesses(name, [from], [to], [immutable])`, allows to read all events of a specific name, independent of what domain or pid it was defined by.
- Added `client.migrateEventsourceStreamFromV2ToV3`, function that migrates data to the new data structure. Function is developed to be safe to call multiple times without side effects.

2.8.0
Indexing "only by pid" and "only by name" on the server... as well the currently "domain:pid" and "domain:pid:name"

2.7.0
Added a factory to make it easier to work with multiple sources of eventsource instances.

2.6.0
Added the ability to read a stream by a group name.

2.5.0
Added the ability to delete from the eventlog by id and name.

2.4.0
Added the ability to read the eventlog by event name. 
OBS! This ability requires all data to be written with the current release, else it won't be indexed correctly and the data can not be read as expected.

1.7.0
Added the ability to fetch the eventlog between a defined timerange.

1.5.0
Do not use redis to cache any data, rely the read model on reading from the stream only

1.2.0
Implemented the ability to fetch events by timerange

0.0.4
Changed the `client.on` function to `client.consume`
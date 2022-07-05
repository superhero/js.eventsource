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
1.7.0
Added the ability to fetch the eventlog between a defined timerange.

1.5.0
Do not use redis to cache any data, rely the read model on reading from the stream only

1.2.0
Implemented the ability to fetch events by timerange

0.0.4
Changed the `client.on` function to `client.consume`
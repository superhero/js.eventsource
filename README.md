# eventsource-v2

The eventsource server listens on two redis channels by default; the `fetch` and the `persist` channels. Both the `fetch` and `persist` channels accept a similar message that defines the name of a new redis channel where the response is expected to be broadcasted, and a sql query formated as a JSON object *( read more about the expected syntax of the **JSON/SQL** query at the repository this solution is dependent on: [json-sql-builder2](https://www.npmjs.com/package/json-sql-builder2) )*

A client connects to the same redis server that the eventsource is connected to and broadcasts a message over one of the default channels. The eventsource system will validate that the message has the required data defined; the sql query which will be used to query the mysql database, and the channel which the mysql response will be transmitted over.

Once the message has been validated, the eventsource system queries the database accordingly and broadcasts the data over the channel that the client has declared. If the result is divided in multiple rows, then the result will be sent in seperate packages, where each package is a mysql row, transmitted as a JSON object. The Eventsource system will pause further transmissions of rows over the defined channel until the client has accepted the former broadcasted mysql row. The client expresses acceptance of previously received row by transmiting an `accepted` message over the defined channel described in the initial message, same channel where the eventsource system is transmitting the mysql results.

If no accepted message is recieved, a `timeout` message is broadcasted, and the channel is discontinued. It is also possible for the client to abrupt the server transmission by transmitting an `end` message. When all rows have been transmitted by the server, then the server will transmit an ending `end` message to indicate that the transmision has completed.

If an unexpected error occures on the server side, then the server will transmit an `error` message. An `error` message indicates that no further data is expected to be transmitted over that channel.

When the channel has ended, it is expected for both the server and client to unsubscribe to the channel. A channel can end for any of the following reasons, also described above; if the server transmitted an `end`, `error` or `timeout` message; if the client transmitted an `end` message.

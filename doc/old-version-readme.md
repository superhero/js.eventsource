# eventsource

This project has both a server and a client solution.

## Install

`npm install superhero`

...or just set the dependency in your `package.json` file:

```json
{
  "dependencies":
  {
    "@superhero/eventsource": "*"
  }
}
```

## Example - Client

Example to use on the client side:

```js
const
  eventsourceFactory  = require('@superhero/eventsource'),
  eventsourceClient   = eventsourceFactory.create({ host:'127.0.0.1', port:'6379' })

// persisting
{
  const
  channel = 'test-persist-channel',
  query   =
  {
    '$insert':
    {
      '$documents':
      {
        'pid'     : 'test-id',
        'domain'  : 'test-domain',
        'name'    : 'test-event',
        'data'    :
        {
          'foo' : 'bar',
          'baz' : 'qux'
        }
      }
    }
  },
  event = { channel, query }

  eventsourceClient.subscribe(channel)
  eventsourceClient.on(channel, (message) =>
  {
    if(data === 'end')
    {
      console.log(channel, 'the end of the channel has been reached')
    }
    else
    {
      console.log(channel, 'message received', message)
      /*
      { fieldCount: 0,
        affectedRows: 1,
        insertId: 0,
        serverStatus: 2,
        warningCount: 0,
        message: '',
        protocol41: true,
        changedRows: 0 }
      */
    }
  })
  eventsourceClient.publish('persist', event)
}
// fetching
{
  const
  channel = 'test-fetch-channel',
  query   =
  {
    '$select':
    {
      '$where':
      {
        'pid' : 'test-id'
      }
    }
  },
  event = { channel, query }

  eventsourceClient.subscribe(channel)
  eventsourceClient.on(channel, (message) =>
  {
    if(data === 'end')
    {
      console.log(channel, 'the end of the channel has been reached')
    }
    else
    {
      console.log(channel, 'message received', message)
      /*
      { timestamp: '2020-04-06T11:35:18.414Z',
        pid: 'test-id',
        domain: 'test-domain',
        name: 'test-event',
        data: '{"baz": "qux", "foo": "bar"}' }
      */
      eventsourceClient.publish('fetch-next', { channel })
    }
  })
  eventsourceClient.publish('fetch', event)
}
```

## Environment variables

Expected environment variables to be set if you start this component as a server:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASS`
- `MYSQL_CHAR`
- `REDIS_HOST`
- `REDIS_PORT`

---

## Notes

The eventsource server listens on three redis channels by default; the `fetch`, `fetch-next` and the `persist` channels. Both the `fetch` and `persist` channels accept a similar message that defines the name of a new redis channel where the response is expected to be broadcasted, and a sql query formated as a JSON object *( read more about the expected syntax of the **JSON/SQL** query at the repository this solution is dependent on: [json-sql-builder2](https://www.npmjs.com/package/json-sql-builder2) )*

The `fetch-next` channel accepts a message that defines what channel the server should resume the mysql stream and publish the next row over.

A client connects to the same redis server that the eventsource is connected to and broadcasts a message over one of the default channels. The eventsource system will validate that the message has the required data defined; the sql query which will be used to query the mysql database, and the channel which the mysql response will be transmitted over.

Once the message has been validated, the eventsource system queries the database accordingly and broadcasts the data over the channel that the client has declared. If the result is divided in multiple rows, then the result will be sent in separate packages, where each package is a mysql row, transmitted as a JSON object. The Eventsource system will pause further transmissions of rows over the defined channel until the client has accepted the former broadcasted mysql row. The client expresses acceptance of previously received row by transmitting an `accepted` message over the defined channel described in the initial message, same channel where the eventsource system is transmitting the mysql results.

If no accepted message is received, a `timeout` message is broadcasted, and the channel is discontinued. It is also possible for the client to abrupt the server transmission by transmitting an `end` message. When all rows have been transmitted by the server, then the server will transmit an ending `end` message to indicate that the transmission has completed.

If an unexpected error occurs on the server side, then the server will transmit an `error` message. An `error` message indicates that no further data is expected to be transmitted over that channel.

When the channel has ended, it is expected for both the server and client to unsubscripted to the channel. A channel can end for any of the following reasons, also described above; if the server transmitted an `end`, `error` or `timeout` message; if the client transmitted an `end` message.


## V3

The client side of the v3 implementation of the eventsource is using redis streams for the write operations.

The eventsource node is a consumer of the stream

 the eventsource is a consumer that manages eventual consistency in differet adopted
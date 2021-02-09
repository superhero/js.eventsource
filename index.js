/*
const
RedisFactory  = require('./src/infrastructure/redis/factory'),
redisFactory  = new RedisFactory()

module.exports = redisFactory
*/


var redis = require('redis');
var client1 = redis.createClient();
var client2 = redis.createClient();
var client3 = redis.createClient();

client1.xadd('mystream', '*', 'field1', 'm1', function (err) {
    if (err) {
        return console.error(err);
    }
    client1.xgroup('CREATE', 'mystream', 'mygroup', '$', function (err) {
        if (err) {
            return console.error(err);
        }
    });

    client2.xreadgroup('GROUP', 'mygroup', 'consumer', 'Block', 1000, 'NOACK',
        'STREAMS', 'mystream', '>', function (err, stream) {
            if (err) {
                return console.error(err);
            }
            const
              streamName  = stream[0][0],
              streamId    = stream[0][1][0][0],
              streamData  = stream[0][1][0][1]

            console.log('client2', stream[0][1][0][1]);
        });

    client3.xreadgroup('GROUP', 'mygroup', 'consumer', 'NOACK',
        'STREAMS', 'mystream', '>', function (err, stream) {
            if (err) {
                return console.error(err);
            }
            console.log('client3', stream);



            client3.xreadgroup('GROUP', 'mygroup', 'consumer', 'NOACK',
            'STREAMS', 'mystream', '>', function (err, stream) {
                if (err) {
                    return console.error(err);
                }
                console.log('client4', stream);
            });
        });

    client1.xadd('mystream', '*', 'field1', 'm2', function (err) {
        if (err) {
            return console.error(err);
        }
    });

    client1.xadd('mystream', '*', 'field1', 'm3', function (err) {
        if (err) {
            return console.error(err);
        }
    });
});
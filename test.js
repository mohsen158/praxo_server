var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var redis = require('redis');

server.listen(8890);
console.log("Server Start");

var redisClient = redis.createClient();

//initial redis server
redisClient.hset("users_rooms", "mohsen", "{room_id:1}", redis.print);
redisClient.hset("users_rooms", "mahdi", "{room_id:1}", redis.print);
redisClient.hset("rooms_users", "1", "['mohsen','mahdi']", redis.print);


/////

//pre connecting
var visitorsData = {};
var userinfo = {};

io.use(function (socket, next) {
    console.log('new user')
    var handshakeData = socket.request;
    newuserid = handshakeData._query['username']
    if (userinfo[newuserid]) {
        if (io.sockets.connected[userinfo[newuserid]['socketid']]) {
            io.sockets.connected[userinfo[newuserid]['socketid']].disconnect();
        }
        delete visitorsData[userinfo[newuserid]['socketid']]
        visitorsData[socket.id] = newuserid
        userinfo[newuserid]['socketid'] = socket.id
        //Todo reload history
        //Todo next
        next()
    }
    else {
        var tmp = {};
        tmp['socketid'] = socket.id;
        tmp['state'] = 0;
        tmp['startroundtime'] = 0;
        userinfo[newuserid] = tmp
        visitorsData[socket.id] = newuserid
        // console.log(userinfo)
        //  console.log(visitorsData)
        //console.log("middleware:", handshakeData._query['username']);
        next();
    }
});
/////

io.on('connection', function (socket) {
    var handshakeData = socket.request;
    userid = handshakeData._query['username']
    redisClient = redis.createClient();
    socket.on('fetchallMessages', function (data) {
        console.log('allmessage:', data)
        data = JSON.parse(data)
        console.log('allmessage:', data)
        redisClient.hget("messagesList", data.room, function (err, reply) {


            socket.emit('receiveMesages', reply)

        });


    })

    socket.on('message', function (data) {

        //TODO‌ store in db
        //TODO sent to receiver
        //data:   {
        //     text: text,
        //     time: Date.now(),
        //     author: {
        //         name: user.name,
        //         avatar: user.avatar,
        //         authorizing: false,
        //         authorized: false
        //     }
        //     ,
        //     room:0
        // };
        redisClient = redis.createClient();

        string = data;

        data = JSON.parse(data)
        io.sockets.emit('receiveMessage', data)


        redisClient.hget("messagesList", data.room, function (err, reply) {
            var messages;
            if (reply) {
                oldMessages = reply.toString()
                messages = oldMessages.split(',')
            }
            else {
                messages = []
            }
            messages.push(string)
            redisClient.hset("messagesList", data.room, messages.toString(), redis.print);

        });

    });


    socket.on('disconnect', function () {
        redisClient.quit();
        delete visitorsData[socket.id];
    });

});
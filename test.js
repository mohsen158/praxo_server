var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var redis = require('redis');

server.listen(8890);
console.log("Server Start");


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
    console.log("new client userid:", userid);


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

        console.log(data);
    });



    var redisClient = redis.createClient();




    socket.on('disconnect', function () {
        console.log('this user disconnected:',userid)
        redisClient.quit();
        delete visitorsData[socket.id];
    });

});
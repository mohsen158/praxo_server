var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var redis = require('redis');
var fs = require("fs");
var multer  = require('multer')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null,  file.originalname  )
    }
})

var upload = multer({ storage: storage })
server.listen(8891);
console.log("Server Start");

var redisClient = redis.createClient();

//initial redis server
redisClient.hset("users_rooms", "mohsen", "{room_id:1}", redis.print);
redisClient.hset("users_rooms", "mahdi", "{room_id:1}", redis.print);
redisClient.hset("rooms_users", "1", "['mohsen','mahdi']", redis.print);

function write(value) {
    /*
     console.log(value)
     var data = fs.readFileSync("\Users\Administrator\Desktop.html"); //read existing contents into data
     var fd = fs.openSync("\Users\Administrator\Desktop.html", 'w+');
     var buffer = new Buffer(value);
     fs.writeSync(fd, buffer, 0, buffer.length, 0); //write new data
     fs.writeSync(fd, data, 0, data.length, buffer.length); //append old data
     // or fs.appendFile(fd, data);
     fs.close(fd);
     */

    fs.appendFile("D:\server\log.html", '\r\n'+value, function (err) {

        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

}


app.get('/',function (req,res) {
    res.send('hiiiiiiiiiiiiiii')

})
// respond with "hello world" when a GET request is made to the homepage
app.post('/uploadImage', upload.single('picture'), function (req, res, next) {
   req.file.filename='test.jpg';
   req.file.path='/uploads/test.jpg';
    console.log(req.file)
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
})
/////

//pre connecting
var visitorsData = {};
var userinfo = {};
/*
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
*/
io.on('connection', function (socket) {
    var handshakeData = socket.request;
    userid = handshakeData._query['username']
    redisClient = redis.createClient();
    socket.on('fetchallMessages', function (data) {
        console.log('allmessage:', data)
        data = JSON.parse(data)
        console.log('allmessage:', data)
        redisClient.hget("messagesList", data.room, function (err, reply) {


           io.emit('receiveMessages', reply)

        });


    })

    socket.on('message', function (data) {
        console.log(io.sockets)
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
        console.log('before ')
        socket.broadcast.emit('receiveMessage', data)
        console.log('after',data)

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
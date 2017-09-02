var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var redis = require('redis');
 console.log("Server Start");
server.listen(8890);
io.on('connection', function (socket) {
 

    var handshakeData = socket.request;
    newuserid = handshakeData._query['username']
    console.log("new client username=",newuserid);
  var redisClient = redis.createClient();
  redisClient.subscribe('message');
 
  redisClient.on("message", function(channel, message) {
    console.log("mew message in queue "+ message + "channel");
    socket.emit(channel, message);
  });
 
  socket.on('disconnect', function() {
    redisClient.quit();
  });
 
});
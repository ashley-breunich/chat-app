'use strict'

let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let clients = [];
let nicknames = [];

app.get('/', function(req, res){
  res.sendFile(__dirname);
});

io.on('connection', function(socket){
  clients.push(socket);

  socket.on('new user', function(data, callback) {
    if(nicknames.indexOf(data) != -1) {
      callback(false);
    } else {
      callback(true);
      socket.nickname = data;
      nicknames.push(socket.nickname);
      console.log(data, 'connected');
    }
  });

  socket.on('room', function(room) {
    socket.leave(room.previous);
    socket.join(room.current);
  });

  socket.on('chat message', (data) => {
    io.in(data.room).emit('chat message', {room: socket.rooms, moniker: socket.nickname, content: data.data});
    console.log(socket.nickname, ' said ', data.data, ' in ', data.room);
    //console.log(socket);
  });

  socket.on('disconnect', function(data){
    console.log(socket.nickname, 'disconnected');
    delete clients[socket.id];
    if(!socket.nickname) return;
    nicknames.splice(nicknames.indexOf(socket.nickname), 1);
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


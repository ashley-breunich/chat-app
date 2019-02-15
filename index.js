'use strict';

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
let superagent = require('superagent');
let API = 'https://4n2vfdefsk.execute-api.us-east-2.amazonaws.com/dev/chatmessages';
let clients = [];
let nicknames = [];
let generalChats = [];
let sportsChats = [];
let codingChats = [];
let fashionChats = [];
const PORT = process.env.PORT || 3000;


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
      console.log(socket.nickname, ' connected');
    }
  });

  socket.on('room', function(room) {
    socket.join(room.current, function() {
      socket.room = room.current;
      console.log(socket.nickname, ' is in room ', socket.room);
      switch(socket.room) {
        case 'sports':
          sportsChats = [];
          update(sportsChats, 'sports');
          break;
        case 'general':
          generalChats = [];
          update(generalChats, 'general');
          break;
        case 'fashion':
          fashionChats = [];
          update(fashionChats, 'fashion');
          break;
        case 'coding':
          codingChats = [];
          update(codingChats, 'coding');
          break;
        default:
          return null;
      }
    });

    

    function update (array, room) {
      superagent.get(`${API}`).query(`room=${room}`).then((results) => {
        for(let i=0; i<results.body.length; i++) {
          let newTime = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: '2-digit',day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}).format(results.body[i].timestamp);
          results.body[i].timestamp = newTime;
          array.push(results.body[i]);     
        }
        while(array.length > 15) {
          array.pop();
        }
        sendData(array, room);
      })
      .catch(error => console.log(error));  
    };
  
    function sendData (array, room) {
      for( let i = array.length - 1; i >= 0; i--) {
        io.sockets.in(room).emit('chat', {room: room, moniker: array[i].moniker, content: array[i].message, timestamp: array[i].timestamp});
      }
      
    }

    socket.leave(room.previous, function () {
        console.log(socket.nickname, ' left room ', room.previous);
    });
  });

  socket.on('submit', (data) => {
    console.log(socket.nickname, ' said ', data, ' in ', data.room);
    const currentTime = Date.now();
    let time = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: '2-digit',day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}).format(currentTime);

    socket.send('Hello everyone');
    
    io.sockets.in(data.room).emit('chat', {room: data.room, moniker: socket.nickname, content: data.data, timestamp: time});
    superagent.post(`${API}`)
    .set('Content-Type', 'application/json')
    .send({
      moniker: socket.nickname,
      room: data.room,
      message: data.data      
    })
    .then(console.log('The last message was posted correctly'))
    //.catch(error => console.log(error));
  });

  socket.on('disconnect', function(data){
    console.log(socket.nickname, 'disconnected');
    delete clients[socket.id];
    if(!socket.nickname) return;
    nicknames.splice(nicknames.indexOf(socket.nickname), 1);
  });

});

http.listen(PORT, function(){
  console.log('listening on ', PORT);
});


'use strict';

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
let superagent = require('superagent');
let API = 'https://67fkyn1o09.execute-api.us-east-2.amazonaws.com/dev/messages';
let clients = [];
let nicknames = [];
let chats = [];
let generalChats = [];
let sportsChats = [];
let codingChats = [];
let fashionChats = [];

function updateChats() {
  getChats();
  //sortChats();
  //reduceChats();
}

function getChats () {
  superagent.get(`${API}`).then((results) => {
   
    console.log(results.body.Items);
  })
  .catch(error => console.log(error));
  
  
};
/*
function sortChats () {
  for( let i = 0;  i < chats.length; i++) {
    if(chats[i].room = 'general') {
      generalChats.push(chats[i]);
    } else if(chats[i].room = 'sports') {
      sportsChats.push(chats[i]);
    } else if(chats[i].room = 'coding') {
      codingChats.push(chats[i]);
    } else if(chats[i].room = 'sports') {
      fashionChats.push(chats[i]);
    }
  }
};

function reduceChats () {
  generalChats.map(timestamp, )
}
*/
app.get('/', function(req, res){
  res.sendFile(__dirname);
});

io.on('connection', function(socket){
  clients.push(socket);

  if(chats.length === 0) {
    updateChats();
  }

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
    // socket.leave(room.previous, function () {
    //     console.log('left room', room.previous);
    //     console.log('Socket now in rooms', socket.rooms);
    // });
    socket.room = room.current;
    socket.join(room.current, function() {
        console.log('socket.room', socket.room);
    });
  });

  socket.on('submit', (data) => {
    console.log('submit message', data);
    const currentTime = Date.now();
    let time = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: '2-digit',day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}).format(currentTime);
    
    console.log('specific room', data.room)
    
    io.sockets.in(socket.room).emit('chat', {room: data.room, moniker: socket.nickname, content: data.data, timestamp: time});
    superagent.post(`${API}/chatmessages`)
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({
      moniker: socket.nickname,
      content: data.data,
      room: data.room,
      timestamp: socket.handshake.time || ''
    }))
    .then(console.log('The last message was posted correctly'))
    .catch(error => console.log(error));
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

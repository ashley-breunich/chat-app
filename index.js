'use strict';

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
let superagent = require('superagent');
let API = 'https://67fkyn1o09.execute-api.us-east-2.amazonaws.com/dev/messages';
let clients = [];
let nicknames = [];
let chats = [];
let allChats = [];
let generalChats = [];
let sportsChats = [];
let codingChats = [];
let fashionChats = [];
let PORT = process.env.PORT || 3000;

function updateChats () {
  superagent.get(`${API}`).then((results) => {
    for(let i=0; i<results.body.Items.length; i++) {
      if(results.body.Items[i].message) {
        allChats.push(results.body.Items[i]);
      }      
    }
    getChats();
  })
  //.catch(error => console.log(error));  
};


function getChats () {
  for( let i = 0;  i < allChats.length; i++) {
    if(allChats[i].room === 'fashion') {
      fashionChats.push(allChats[i]) 
    } else if(allChats[i].room === 'sports') {
      sportsChats.push(allChats[i])
    } else if(allChats[i].room === 'coding') {
      codingChats.push(allChats[i])
    } else if(allChats[i].room === 'general') {
      generalChats.push(allChats[i])
    }
  };
  console.log('general ', generalChats);
  console.log('sports ', sportsChats);
  console.log('coding ', codingChats);
  console.log('fashion ', fashionChats);
  //sortChats();
};



/*
//Sort by time and reduce to 15
function sortChats () {
  generalChats.sort(timestamp, )
}
*/


app.get('/', function(req, res){
  res.sendFile(__dirname);
});

io.on('connection', function(socket){
  clients.push(socket);

  if(chats.length === 0) {
    chats = 1;
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
    socket.join(room.current, function() {
        socket.room = room.current;
        console.log('socket.room', socket.room);
    });
    socket.leave(room.previous, function () {
        console.log('left room', room.previous);
        console.log('Socket now in rooms', socket.rooms);
    });
  });

  socket.on('submit', (data) => {
    console.log('submit message', data);
    const currentTime = Date.now();
    let time = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: '2-digit',day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}).format(currentTime);
    
    console.log('specific room', data.room)
    
    io.sockets.in(data.room).emit('chat', {room: data.room, moniker: socket.nickname, content: data.data, timestamp: time});
    superagent.post(`${API}`)
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({
      moniker: socket.nickname,
      message: data.data,
      room: data.room,
      timestamp: time || ''
    }))
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
  console.log('listening on',PORT);
});

const express = require('express');
const app = express();
const http = require('http');
const { listenerCount } = require('process');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000;

app.use("/static/",express.static("static"));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Object Room
const Room = {
    id: "",
    TabUser : [],
    TabMsg :[],
    count : 0
}
// List Rooms
const ListRoom = [Room];
// Generate Random id user [0-100]
const idRoom = Math.floor((Math.random() * 100) + 1);
// Connect
io.on('connection', socket => {
    let id_User = socket.id;
    Room.count = Room.count+1;
    Room.id = idRoom;
    Room.TabUser.push(socket.id);
    io.emit('start',Room.count,socket.id);
    // Get history chat for new User in room
    if(Room.TabMsg != null){
    socket.emit('getMsg',id_User,Room.TabMsg);
    }

// Disconnect
socket.on('disconnect', function(){
    Room.count = Room.count-1;
       if(id_User==Room.TabUser){
           //console.log(Room.TabUser);// Id user left
           Room.TabUser.splice(id_User,1); // Remove Id user left from array user in room
       }
    io.emit('deco',Room.count,id_User)
});
// Send msg in Chat
    socket.on('chat message', (msg) => {
        // detect command
        const cmd = msg.split(' ')[0];
        if(cmd.startsWith("/")){
        switch(cmd){ // List Command
            // detect list command
            case '/list':
                socket.emit('/list',Room.TabUser); // Get All Users
                //console.log(Room.TabUser);
                break;
            case '/createRoom':
                const newRoom = Math.floor((Math.random() * 100) + 1);
                    ListRoom.push({
                            id: newRoom,
                            TabUser : [],
                            TabMsg :[],
                            count : 0
                        })
                    console.log(ListRoom);
                break;
            case '/listRoom':
                // Get all room Id
                    socket.emit('/listRoom',ListRoom.map((room)=>{
                        return room.id;
                    }));
                    break;
            case '/join':
                    const chanel = msg.split(' ')[1];
                    for (let room of ListRoom){
                        if(room.id === chanel){
                            room.TabUser.push(socket);
                        }
                    }
                    break;
            default: 
                socket.emit('/none',cmd) // Default Value, display cmd not find
            }
        }else{ 
            let room_users = [];
            let current_room;
            for (let room of ListRoom){
                for( let user of room.TabUser){
                    if(user.id === socket.id){
                        room_users = room.TabUser;
                        current_room = room;
                    }
                }
            }
            for(let user of room_users ){
                user.emit('chat message',msg,id_User);
            }
           /*current_room.TabMsg.push(msg);*/
           Room.TabMsg.push(msg);
           io.emit('chat message',msg,id_User);
        } 
        io.emit(Room.TabMsg);
    });
    io.emit(Room.TabMsg);
    })  
server.listen(port, () => {
  //console.log('listening on *:port');
});
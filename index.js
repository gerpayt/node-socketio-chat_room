var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


var userid_list = [];
var socket_list = [];
var username_dict = {};

app.get('/', function(req, res){
    res.sendfile('index.html');
});

app.get('/main.js', function(req, res){
    res.sendfile('main.js');
});

app.get('/main.css', function(req, res){
    res.sendfile('main.css');
});

http.listen(9300, function(){
    console.log('listening on *:9300');
});


io.on('connection', function(socket){
    var nickname = parse_from_cookie(socket.handshake.headers.cookie,'nickname');
    if (nickname == '')
        nickname = socket.id;
    if (get_username_list().indexOf(nickname) != -1){
        var ori_nickname = nickname;
        var i=1;
        while (get_username_list().indexOf(nickname) != -1) {
            nickname = ori_nickname + '_' + i;
            i += 1;
        }
    }
    userid_list.push(socket.id);
    socket_list.push(socket);
    username_dict[socket.id] = nickname;

    socket.broadcast.emit('user_list',get_username_list());
    socket.emit('user_list',get_username_list());
    console.log(nickname+' connected');

    socket.emit('welcome', nickname);
    socket.broadcast.emit('system', nickname+' 加入了聊天室');

    socket.on('disconnect', function(){
        console.log('user disconnected');
        indexof = userid_list.indexOf(socket.id);
        if (indexof != -1) {
            socket_list = socket_list.slice(0, indexof).concat(socket_list.slice(1 + indexof));
            userid_list = userid_list.slice(0, indexof).concat(userid_list.slice(1 + indexof));
        }
        socket.broadcast.emit('system', nickname+' 离开了聊天室');
        socket.broadcast.emit('user_list',get_username_list());
    });
    socket.on('rename', function(newname){
        indexof = userid_list.indexOf(socket.id);
        if (indexof != -1) {
            socket_list = socket_list.slice(0, indexof).concat(socket_list.slice(1 + indexof));
            userid_list = userid_list.slice(0, indexof).concat(userid_list.slice(1 + indexof));
        }
        if (get_username_list().indexOf(newname) != -1){
            var ori_nickname = newname;
            var i=1;
            while (get_username_list().indexOf(newname) != -1) {
                newname = ori_nickname + '_' + i;
                i += 1;
            }
        }
        userid_list.push(socket.id);
        socket_list.push(socket);

        username_dict[socket.id] = newname;

        console.log(nickname+' rename to ' + newname);
        socket.broadcast.emit('system', nickname+' 把名字改成了 ' + newname);
        socket.emit('system', nickname+' 把名字改成了 ' + newname);
        username_dict[socket.id] = newname;
        nickname = newname;
        socket.emit('welcome', newname);
        socket.broadcast.emit('user_list',get_username_list());
        socket.emit('user_list',get_username_list());
    });
    socket.on('chat', function(msg){
        if (msg[0]=='#' && msg.indexOf(':') != -1 && msg.indexOf(':')+1 <= msg.length){
            touser = msg.slice(1,msg.indexOf(':'));
            msg =  msg.slice(msg.indexOf(':')+1);
            console.log(nickname+' says to '+touser+': ' + msg);
            var indexof = get_username_list().indexOf(touser);
            if ( indexof != -1){
                try{
                    socket_list[indexof].emit('chat', nickname+'对'+touser+'说：' + msg);
                    socket.emit('chat', nickname+'对'+touser+'说：' + msg);
                }catch(err){
                    console.log(err);
                }
            }
        }else{
            console.log(nickname+' says: ' + msg);
            socket.broadcast.emit('chat', nickname+'说： ' + msg);
            socket.emit('chat', nickname+'说：' + msg);
        }
    });
});

function get_username_list(){
    var username_list=[];
    for (var id in userid_list){
        if (typeof(userid_list[id]) != "undefined")
            username_list.push(encodeURI(username_dict[userid_list[id]]));
    }
    return username_list;
}

function parse_from_cookie(cookie,name){
    try {
        var arr = cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
        if(arr != null) return decodeURI(arr[2]); return '';
    }
    catch(err){
        console.log(err);
    }
    return '';
}
var socket = io();
$('#nickname').val(getCookie('nickname'));
$('#send').click(function(){
    var message = $('#message').val();
    if (message=='') return false;
    if (message[0]=='#' && message.indexOf(':')+1 == message.length) return false;
    socket.emit('chat', message);
    $('#message').val('');
});
$(document).keypress(function(e) {
    if (e.ctrlKey && e.which == 10)
        $('#send').click();
});

$('#rename').click(function(){
    if ($('#nickname').val()=='') return false;
    socket.emit('rename', $('#nickname').val());
    SetCookie('nickname',$('#nickname').val());
});

$('#exit').click(function(){
    window.opener=null;
    window.open('','_self');
    window.close();
});

socket.on('chat', function(msg){
    $('#message-list').append($('<li>').text(msg)).scrollTop(999999);
    ;
});

socket.on('system', function(msg){
    $('#message-list').append($('<li>').addClass('blue').text(msg)).scrollTop(999999);
});

socket.on('welcome', function(nickname){
    $('#nickname').val(nickname);
    $('#message-list').append($('<li>').addClass('red').text('欢迎你 '+nickname)).scrollTop(999999);
});

socket.on('user_list', function(user_list){
    $('#user-list').empty();
    for (user in user_list) {
        $('#user-list').append($('<li>').text(decodeURI(user_list[user])));
    }
    $('#user-list li').click(function(){
        $('#message').val('#'+$(this).html()+':');
    });
});

function SetCookie(name,value)//两个参数，一个是cookie的名子，一个是值
{
    var Days = 30; //此 cookie 将被保存 30 天
    var exp  = new Date();    //new Date("December 31, 9998");
    exp.setTime(exp.getTime() + Days*24*60*60*1000);
    document.cookie = name + "="+ encodeURI(value) + ";expires=" + exp.toGMTString();
}
function getCookie(name)//取cookies函数
{
    var arr = document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
    if(arr != null) return decodeURI(arr[2]); return null;

}


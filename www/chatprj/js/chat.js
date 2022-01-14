"use strict"

var url = location.href;
//var arr = url.split("?");
var uname= url.split("?")[1].split("=")[1];

var hWeclome = document.querySelector("h1#welcome")
hWeclome.textContent ="欢迎来到聊天室: "+ uname;

var txaMsgList = document.querySelector("textarea#msgList");
var iptMsg = document.querySelector("input#msg");
var btnSend = document.querySelector("button#send");
var btnExit = document.querySelector("button#exit");
var btnVideo = document.querySelector("button#videoRoom");

var room = "defalutRoom";

var socket = null;

function  start(){
    socket = io.connect();
    socket.emit("cjoin",room,uname);
    socket.on("cjoinsuc",(room,users)=>{
        if(room==="defalutRoom"){
            room = "聊天大厅";
        }
        txaMsgList.value = "恭喜进入"+room+"房间\n";
        txaMsgList.value +="房间已有"+users+"人\n";
    });
    socket.on("cotherjoined",(name)=>{
       txaMsgList.value+="欢迎"+uname+"进入房间\n";
       if(name===uname)
       {
           alert("您的账号在别处登入了");//特性，要选中网页才能弹出
           //或在main.js，结合下面语句用url的不同来进行控制
           window.location.href = "index.html?force=1";
           return;
       }
    });

    socket.on("cgetmsg",(uname,msg)=>{
        txaMsgList.value += uname+":"+msg+"\n";
    });

    socket.on("cexited",()=>{
       history.back();
    });
    socket.on("cotherexited",(uname)=>{
       txaMsgList.value += uname+"离开了房间\n";
    });
}

start();
function sendMsg()
{
    if(iptMsg.value===""){
        return;
    }
    var msg = iptMsg.value;
    socket.emit("cmsg",room,uname,msg);
    iptMsg.value="";
}

function exit()
{
    socket.emit("cexit",room,uname);
}
function videoRoom()
{
    window.location.href="videoRoom.html?uname="+uname;
}
btnExit.onclick = exit;
btnSend.onclick = sendMsg;
btnVideo.onclick = videoRoom;



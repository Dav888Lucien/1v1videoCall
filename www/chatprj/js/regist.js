"use strict";

var iptUname = document.querySelector("input#username");
var iptPasswd = document.querySelector("input#password");
var iptPPasswd = document.querySelector("input#ppassword");
var btnSure = document.querySelector("button#sure");
var btnBack = document.querySelector("button#back");

//先定义链接服务器的socket变量
var socket = null;


function regist()
{
    if (iptUname.value === "" || iptPasswd.value === "" || iptPPasswd.value === "" || iptPasswd.value !== iptPPasswd.value) {
        alert("请输入用户名，并确认两次输入的密码一致");
    } else {
        alert("发送消息给服务器");

    }

    var uname = iptUname.value;
    var pwd = iptPPasswd.value;

    socket.emit("register",uname,pwd);


}


function start()
{
    socket= io.connect();//连接服务器
    socket.on("samename",()=>{
       alert("用户名已存在，请更换用户名");
    });
    socket.on("servererr",()=>{
        alert("服务器操作出错，请重试");
    });
    socket.on("registok",(uname)=>{
        alert("账号"+uname+"注册成功"+"\n返回登入界面");
       goBack();
    });
}

function goBack()
{
    history.back();
}
start();
btnSure.onclick = regist;
btnBack.onclick = goBack;

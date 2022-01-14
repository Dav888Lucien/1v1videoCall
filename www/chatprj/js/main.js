"use strict";

var iptUname = document.querySelector("input#username");
var ipPasswd = document.querySelector("input#password");
var btnRegist = document.querySelector("button#register");
var btnLogin = document.querySelector("button#login");

// var url =location.href;
// var urlArr = url.split("?");
// if(urlArr.length===2){
//     if(urlArr[1].split("=")[1]==="1")
//         alert("您的账号在别处登入了");
// }

var socket = null;

function login()
{
    if(iptUname.value === "" || ipPasswd.value === "")
    {
        alert("Please enter Username and password");
    }
    var uname =iptUname.value;
    var pwd = ipPasswd.value;
    //alert(uname+" ： \n"+pwd);
    socket.emit("login",uname,pwd);
}
//一旦启动连上服务器
function start()
{
    socket = io.connect();
    //监听来自服务器的消息
    socket.on("login successfully",(uname)=>{
        alert("登入成功");
        //alert("跳转页面");
       window.location.href="chat.html?uname="+uname;//用url来传递参数
    });
    socket.on("login failed",()=>{
        alert("用户或密码错误");
    });
    socket.on("servererro",()=>{
        alert("服务器异常，请重试！");
    })
}
start();
//注册
function regist()
{
    window.location.href="register.html";
}


btnLogin.onclick = login;
btnRegist.onclick = regist;
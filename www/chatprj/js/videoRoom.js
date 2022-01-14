"use strict";

var url = location.href;
var uname = url.split("?")[1].split("=")[1];
var hWelcome = document.querySelector("h1#welcome");
hWelcome.textContent="欢迎 "+uname +" 进入1v1视频聊天室";

var iptRoom = document.querySelector("input#room");
var btnEnterRoom = document.querySelector("button#enterRoom");
var btnLeaveRoom = document.querySelector("button#leaveRoom");
var localVideo = document.querySelector("video#localVideo");
var remoteVideo = document.querySelector("video#remoteVideo");
var  btnSendMsg = document.querySelector("button#sendMsg");

var socket = null;
var room = null;
var localStream = null;
var remoteStream = null;
var pc =null;
var state ="init";

function start() {

    var constraints = {
        video:true,
        audio:true
    }

    //异步运行。getUserMedia 打开摄像头
    navigator.mediaDevices.getUserMedia(constraints)
        //获取成功执行,调取视频信息放在getStream方法所指定的位置
        .then(getStream)
        //获取失败执行
        .catch(handleErr);
    conn();
}
function createPeerConnection()
{
    if(!pc){
        //搭好的服务器
        var turnConfig = {
            "iceServers":[{
                "urls":"turn:47.254.90.250:3478",
                "username":"luwei",
                "credential":"123456"
            }]
        };
        pc = new RTCPeerConnection(turnConfig);//pc自动查候选者内容,创建peerConnection
        //发送信息给对方
        pc.onicecandidate = (e)=>{
            if(e.candidate){
                //打印候选者信息
                console.log("Candidate:",e.candidate);
                sendMessage({
                    type:"candidate",
                    label:e.candidate.sdpMLineIndex,
                    id:e.candidate.sdpMid,
                    candidate:e.candidate.candidate
                });
            }
        }
        //对方接收到我方信息并发送信息
        pc.ontrack = (e)=>{
            remoteStream = e.streams[0];
            remoteVideo.srcObject = e.streams[0];
        }

        //本地的媒体流加入到peerConnection
        if(localStream){
            //将所有轨捕捉
            localStream.getTracks().forEach((track)=>{
                pc.addTrack(track,localStream);
            });
        }

    }
}

function getOffer(desc){
    pc.setLocalDescription(desc)
        .catch(handleErr);
    sendMessage(desc);
}
function negotiate(){
    //先进的人向后面的人发起
    if(state==="joined_conn"){
        if(pc){
            var options ={
                offerToReceiveAudio:true,
                offerToReceiveVideo:true
            }
            pc.createOffer(options)
            .then(getOffer)
                .catch(handleErr);

        }
    }
}

function conn()
{
    socket = io.connect();
    //监听各种消息

    //加入房间的消息
    socket.on("vjoined",(room)=>{
       alert("成功加入房间："+room);

       iptRoom.disabeled = true;
       btnEnterRoom.disabled = true;
       btnLeaveRoom.disabled = false;
        //peer 连接(通网)
        createPeerConnection();
        state = "joined";
        console.log("vjoined:",state);

    });

    socket.on("vfull",(room)=>{
        alert("房间已满:"+room);
        state="leaved";
        console.log("vfull",state);
    });


    socket.on("votherjoined",(room,uname)=>{
        alert(uname+"加入了房间");

        if(state ==="joined_unbind"){
            createPeerConnection();
        }
       //最后都应该为joined connected的状态
        state = "joined_conn";
        //媒体协商
        negotiate();
        console.log("votherjoined",state);
    });

    //离开时的消息================
    socket.on("vleaved",(room)=>{
        alert("离开房间： "+room);
        iptRoom.disabled = false;
        btnEnterRoom.disabled = false;
        btnLeaveRoom.disabled = true;
        state = "leaved";
        console.log("vleaved",state);
    });
    socket.on("votherleaved",(room,uname)=>{
        alert(uname+"离开了房间");
        //回到断开状态
        state="joined_unbind";
        closePeerConnection();
        console.log("votherleaved:",state);
    });

    //data
    socket.on("vgetdata",(room,data)=>{

        console.log(data);
        if(!data)
            return;
        if(data.type==="candidate"){
            console.log("get candidate");
            pc.addIceCandidate({
                sdpMLineIndex:data.label,
                candidate:data.candidate
            }).catch(handleErr);
            //收到媒体描述信息offer
            //desc 默认信息为“offer”
        }else if(data.type==="offer"){
            pc.setRemoteDescription( new RTCSessionDescription(data))
                .catch(handleErr);
            pc.createAnswer()
                .then(getAnswer)
                .catch(handleErr);
        }else if(data.type==="answer"){
            //设置远端的媒体描述信息
            pc.setRemoteDescription(new RTCSessionDescription(data))
                .catch(handleErr);
        }else{
            console.log("err message");
        }
    });
}
function closePeerConnection(){
    console.log("closer PeerConnection");
    if(pc){
        pc.close();
        pc=null;
    }
}
function getAnswer(desc){
    pc.setLocalDescription(desc)
        .catch(handleErr);
    sendMessage(desc);
}

function sendMessage(data)
{
    if(socket){
        socket.emit("vdata",room,data);
    }
}
function getStream(stream)
{
        localStream = stream;
        localVideo.srcObject = stream;//本地数据流设置好并在html中设置的位置显示
}
function  handleErr(err)
{
    console.log(err);
}

start();

function enterRoom()
{
    if(iptRoom.value==="")
    {
        alert("请输入房间号");
        return
    }
    room = iptRoom.value;
    socket.emit("vjoin",room,uname);


}

function leaveRoom(){
    socket.emit("vleaved",room,uname);
    closePeerConnection();//断开
}
function sendMsg()
{
    sendMessage({
        "name":uname,
        "gender":1
    });
}
btnEnterRoom.onclick = enterRoom;
btnLeaveRoom.onclick = leaveRoom;
btnSendMsg.onclick = sendMsg;
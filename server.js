"use strict"

var http = require("http");
var https = require("https");
var fs = require("fs");

//get more modules
var expree = require("express");//get web service install on terminal
var serveIndex = require("serve-index");

var log4js = require("log4js");
var sqlite3 = require("sqlite3");
var socketIo = require("socket.io");


const e = require("express");

var logger =log4js.getLogger();
logger.level ="info";//打印日志（print）



var app = expree();
app.use(serveIndex("./www"));
app.use(expree.static("./www"));
var httpServer = http.createServer(app)
	.listen(8888,"0.0.0.0");
/*
var app = http.createServer(function(req,res){
	res.writeHead(200,{"Content-Type":"text/plain"});
	res.end("hello http\n");
}).listen(8888,"0.0.0.0");
*/

var options = {
	key:fs.readFileSync("./cert/ssl_server.key"),
	cert:fs.readFileSync("./cert/ssl_server.crt"),
}


var httpsSever = https.createServer(options,app)
	.listen(443,"0.0.0.0");
var io = socketIo.listen(httpsSever);

function sockets() {

}

//一旦用户连服务器
io.sockets.on("connection",(socket)=>{
	logger.info("connect:",socket.id);//进行日志操作打印id


	//登入
	socket.on("login",(uname,pwd)=>{
		db.all("select * from users where name =? and pwd=?",
			[uname,pwd],(e,rows)=>{
				if(e){
					handlErro(e);
					socket.emit("servererro");
				} else
					if(rows.length===1){
						socket.emit("login successfully",uname);
					}else{
						socket.emit("login failed");
					}
			});
	});

	//注册
	socket.on("register",(uname,pwd)=>{
		logger.info("register:",uname,pwd);

		//遍历db，是否有相同的用户名
		db.all("select * from users where name=?", uname,(e,rows)=>{
			if(e)
			{
				handlErro(e);
				socket.emit("servererr");
			}else
			{
				if(rows.length === 1)
				{
					//用户名已存在
					socket.emit("samename");
				}else
				{
					//插入新的用户名和密码
					//'?'的值由后续'[...]'内的参数直接替换
					db.run("insert into users(name,pwd) values(?,?)",
						[uname,pwd],(e)=>{
						if(e)
						{
							handlErro(e);
							socket.emit("servererr");
						}else
						{
							socket.emit("registok",uname);
							// db.all("select * from users",(e,rows)=>{
							// 	logger.info("当前已注册用户数："+
							// 	rows.length);}
							// );
							//
						}


					});
				}
			}
		});

	});

	//文本聊天室，都加一个前缀’c‘
	socket.on("cjoin",(room,uname)=>{

		logger.info("cjoin:",room,uname);
		socket.join(room);

		var myRoom =io.sockets.adapter.rooms[room];
		var users = Object.keys(myRoom.sockets).length
		logger.info("房间"+room+"有"+users+"人");
		socket.emit("cjoinsuc",room,users);

		socket.to(room).emit("cotherjoined", uname);

	});

	socket.on("cmsg",(room,uname,msg)=>{
		logger.info("cmsg:",room,uname,msg);
		  io.in(room).emit("cgetmsg",uname,msg);
	});
	socket.on("cexit",(room,uname)=>{
		var myRoom =io.sockets.adapter.rooms[room];//获得房间数据
		var users = Object.keys(myRoom.sockets).length;//获得房间人数

		socket.leave(room);
		logger.info(uname+"cexit "+" users:",users-1);

		socket.emit("cexited");
		socket.to(room).emit("cotherexited",uname);
	});

	//1v1视频聊天,前缀用’v‘
	socket.on("vjoin",(room,uname)=>{
		logger.info("vjoin",room,uname);

		socket.join(room);
		var myRoom =io.sockets.adapter.rooms[room];
		var users = Object.keys(myRoom.sockets).length;
		if(users>2){
			socket.leave(room);
			socket.emit("vfull",room);
		}else{
			socket.emit("vjoined",room);
			if(users>1){
				socket.to(room).emit("votherjoined",room,uname);
			}
		}
		socket.on("vdata",(room,data)=>{
			socket.to(room).emit("vgetdata",room,data);
			logger.info("vdata",room,data);
		});

	});

	socket.on("vleave",(room,uname)=>{
		var myRoom =io.sockets.adapter.rooms[room];
		var users = Object.keys(myRoom.sockets).length;

		socket.leave(room);
		logger.info("vleave, users = "+users-1);

		socket.emit("vleaved",room);
		socket.to(room).emit("votherleaved",room,uname);
	});

});

logger.info("web 服务成功启动");

//database
var db = null;
db = new sqlite3.Database("app.db",(e)=>{
	if(e)//如果创建失败
		logger.info(e);
	else
		logger.info("创建数据库app.db成功");
});

//同步执行数据库操作语句 否则数据库代码会异步运行
db.serialize(()=>{
	var sql = "";
	//建表 reate table if not exists都可以用，无论有表无表
	db.run("create table if not exists users(id integer primary key autoincrement," +
		"name char(50) unique, pwd char(200))",(e)=> {
		if(e)
			handlErro(e);
		else
			logger.info("create table users successfully");
	});
	//插入一条（第一条实验）数据
	// sql = "insert into users(name, pwd) values('kk','123')"
	// db.exec(sql,(e)=>{
	// 	if(e)
	// 		handlErro(e);
	// 	else
	// 		logger.info("插入一条数据成功");
	// })

	//查询
	sql="select * from users";
	db.all(sql,(e,rows)=>{
		if(e)
			handlErro(e);
		else{
			//logger.info(rows);
			logger.info("当前已注册用户数："+ rows.length);
			logger.info(rows.length);
			logger.info(rows[0]);
			logger.info(rows[1]);
			logger.info(rows[1]["id"]);
			logger.info(rows[1]["name"]);
			logger.info(rows[1]["pwd"]);


		}

	});


});

function  handlErro(e)
{
	logger.info(e);
}
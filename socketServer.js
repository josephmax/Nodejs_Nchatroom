/**
 * Created by hxsd on 2016/5/26.
 */
var http = require("http")
    , socketio = require("socket.io")
    , express = require("express")
    ,url=require("url")
    ,qs=require("querystring")
    ,bodyParser=require("body-parser")
    ,path=require("path")
    ,fs=require("fs")

    ;
var app = express();

var port = 8765;

var chatHttp = http.createServer(app);

var io = socketio.listen(chatHttp);

chatHttp.listen(port, function () {
    console.log("=============服务器运行在端口：" + port + "=============http://localhost:" + port);
});

app.use(express.static("public"));
//app.use(express.bodyParser());
app.get("/show",function(req,res){
    var picPath=qs.parse(url.parse(req.url).query).picPath;
    fs.createReadStream(__dirname+"/public/"+picPath).pipe(res);
    //res.sendFile(__dirname+"/public"+picPath);
});
var userencodedParser = bodyParser.urlencoded({extended:false});
app.post("/nameValid",userencodedParser,function(req,res){
    var flag=false;
    for (i in users){
       if(users[i].nickname==req.body.validName){
           flag=true;
       }
    }
    res.send(flag);
});
var users=[];
io.on("connection", function (client) {
    client.on("myMsg", function (data) {
        client.broadcast.emit("broadcastMsg", data);
        client.emit("yourMsg", data);
    });
    client.on("myEnter", function (data) {
        users.push(data);
        data.userQuantity=users.length;
        console.log(data);
        client.broadcast.emit("userEnter", data);
        client.emit("welcome",users);
        client.on("myBusy",function(data){
            io.sockets.emit("userBusy", data);
        });
        client.on("disconnect", function () {
            for(i in users){
                if (users[i].nickname==data.nickname){
                    users.splice(i,1);
                }
            }
            data.userQuantity=users.length;
            client.broadcast.emit("userLeave",data);
            client.broadcast.emit("userFlush",users);
        });
    });
});


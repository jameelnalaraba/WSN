var WebSocket = require('ws');
var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/test', 
{useNewUrlParser: true, useUnifiedTopology: true});

var wss = new WebSocket.Server({
	port: 8080
});

var User = mongoose.model('user', {
	user: String,
	pass: String
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Database connected!");
});
wss.on('connection', function (cws, req){
	console.log(`New connection from ${req.connection.remoteAddress}`);
	cws.on('message', function(msg){
		if (msg == "get"){
			User.find(function(err,data){
				cws.send(JSON.stringify(data));
			});
		}
		else if (msg.startsWith("put")){
			try{
				var args = msg.split(" ");
				var user1 = new User({
					user: args[1],
					pass: args[2]
				});
				user1.save().then(() => {
					cws.send("User has been added succesfully");
				})
					
			}catch(err){
				console.log(err);
				cws.send("please enter the format: put [user] [pass]");
			}
			
		}
		else if (msg.startsWith("remove")){
			var args = msg.split(" ");
			User.find({user: args[1]}).deleteOne(() => {cws.send("Successfully deleted!")});
		}
		else if (msg.startsWith("find")){
			var args = msg.split(" ");
			User.exists({user:args[1]}, function (err, result) {
				if (err){
					cws.send("error");
				}else{
					cws.send("User "+ (result ? "exists":"doesn't exist"));
				}
			});
		}
	});
});
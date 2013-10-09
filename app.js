var port = process.env.PORT || 5000 
  , express = require('express')
  , socket = require('socket.io')
  , app = express.createServer();


app.use(express.static(__dirname + '/public'));

// Heroku won't actually allow us to use WebSockets
// so we have to setup polling instead.
// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
var io = socket.listen(app);
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

app.listen(port, function() {
  console.log(
    "Express server listening on port %d in %s mode", 
    app.address().port, 
    process.env.NODE_ENV
  );
});

io.sockets.on('connection', function (socket) {
  console.log("HIII");
}); 

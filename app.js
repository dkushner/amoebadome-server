var port = process.env.PORT || 5000 
  , express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')
  , socket = require('socket.io')
  , uuid = require('node-uuid')
  , app = express.createServer()
  , _ = require('underscore');


app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {
  layout: false,
  pretty: true
});

app.use(stylus.middleware({
  src: __dirname + '/views',
  dest: __dirname + '/public',
  compile: function(str, path) {
    return stylus(str)
    .set('filename', path)
    .set('compress', true)
    .use(nib());
  }
}));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.render('index');
});

/*var io = socket.listen(app);
io.configure(function () {
  io.set("log level", 2);
});*/

app.listen(port, function() {
  console.log(
    "Express server listening on port %d in %s mode", 
    app.address().port, 
    process.env.NODE_ENV
  );
});

/*
var clients = {};
io.sockets.on('connection', function (client) {
  client.uuid = uuid.v4();
  clients[client.uuid] = {}; 
  client.emit('client.accept', { uuid: client.uuid });
  console.log("Registered Client: ", client.uuid);

  _.each(clients, function(el) {
    _.each(el, function(agent) {
      client.emit('agent.create', agent.uuid, agent.type, agent.data);
    });
  });

  // Tell other clients to create this proxy.
  client.on('agent.create', function(id, type, data) {
    var remote = uuid.v4();
    clients[client.uuid][id] = {
      uuid: remote,
      type: type,
      data: data
    };
    client.broadcast.emit('agent.create', remote, type, data);
    console.log("User ", client.uuid, "created agent ", remote);
  });

  client.on('agent.tick', function(id, data) {
    var agent = clients[client.uuid][id];
    agent.data = data;

    // Test!
    client.broadcast.emit('agent.tick', agent.uuid, data);
  });

  client.on('disconnect', function() {
    _.each(clients[client.uuid], function(agent) {
      client.broadcast.emit('agent.destroy', agent.uuid);
    });
    delete clients[client.uuid];
    console.log("Unregistered Client: ", client.uuid);
  });
}); 
*/

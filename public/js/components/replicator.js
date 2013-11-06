define(['component'], function(Component) {

  var Replicator = function(targets) {
    this._socket = Network.socket;
    this._targets = targets;
    this._tickRate = 1000 / 30;

    Component.call(this, "replicator"); 
  }
  Replicator.prototype = Object.create(Component.prototype);
  Replicator.prototype.constructor = Replicator;

  Replicator.prototype.setOwner = function(owner) {
    var data = _.reduce(this._targets, function(ag, el) {
      ag[el] = _.deep(owner, el);
      return ag;
    }, {});

    this._socket.emit('agent.create', owner.id, "PlayerBase", data); 
    Component.prototype.setOwner.call(this, owner);
  };

  Replicator.prototype.update = function(time) {
    this._lastTick = this._lastTick || time; 
    if (this._owner && time - this._lastTick > this._tickRate) {
      this._lastTick = time;

      var data = _.reduce(this._targets, function(ag, el) {
        ag[el] = _.deep(this._owner, el)
        return ag;
      }, {}, this);

      this._socket.emit('agent.tick', this._owner.id, data); 
    }
  }

  return Replicator;
});

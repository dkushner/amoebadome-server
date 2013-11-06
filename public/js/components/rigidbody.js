var Rigidbody = function(mass, shape) {
  this._body = new CANNON.RigidBody(mass, shape);
  Component.call(this, "rigidbody");
};
Rigidbody.prototype = Object.create(Component.prototype);
Rigidbody.prototype.constructor = Rigidbody;

Rigidbody.prototype.setOwner = function(owner) {
  Game.Physics._world.add(this._body);  
  
  owner.position.copy(this._body.position);
  owner.quaternion.copy(this._body.quaternion);

  Game.Physics.addListener('step', _.bind(function() {
    this._body.position.copy(this._owner.position);
    this._body.quaternion.copy(this._owner.quaternion);
  }, this));
  Component.prototype.setOwner.call(this, owner);
};


var Follow = function(target) {
  Object.defineProperty(this, 'target', {
    get: function() {
      return this._target;
    },
    set: function(v) {
      this._target = v;
      if(this._target) {
        this._owner.position.addVectors(this._target.position, this.offset);
        this._owner.lookAt(this._target.position);
      }
    }
  });

  this.target = target;
  this.offset = new THREE.Vector3(0, 0, 0);

  Component.call(this, "follow");
};
Follow.prototype = Object.create(Component.prototype);
Follow.prototype.constructor = Follow;

Follow.prototype.update = function(dt) {
  if (this.target === undefined) return;

  this._owner.position.addVectors(this.target.position, this.offset);
};

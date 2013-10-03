var PhysicsService = Class.create(EventEmitter.prototype, {
  initialize: function() {
    var world = new CANNON.World();
    world.gravity.set(0, -50, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    this._world = world;
    this._tick();
  }, 
  _tick: function() {
    window.requestAnimationFrame(this._tick.bind(this));
    this._world.step(1 / 60);
    this.emitEvent('step');
  }
});

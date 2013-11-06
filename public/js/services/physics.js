var deps = [
  'underscore',
  'vendor/cannon'
];

define(deps, function(_, CANNON) {
  var world = new CANNON.World();
  world.gravity.set(0, -50, 0);
  world.broadphase = new CANNON.NaiveBroadphase();

  var tick = function() {
    window.requestAnimationFrame(tick.bind(this));
    world.step(1 / 60);
  };

  return {
    addBody: function(rb) {
        world.add(rb);
    }
  }
});

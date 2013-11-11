var deps = [
  'underscore',
  'vendor/cannon'
];

define(deps, function(_, CANNON) {
  var world = new CANNON.World();
  world.gravity.set(0, -50, 0);
  world.broadphase = new CANNON.NaiveBroadphase();

  world.defaultContactMaterial.contactEquationStiffness = 5e7;
  world.defaultContactMaterial.contactEquationRegularizationTime = 4;

  var tick = function() {
    world.step(1 / 60);
    window.requestAnimationFrame(tick.bind(this));
  };
  tick();

  return {
    addBody: function(rb) {
      world.add(rb);
    },
    removeBody: function(rb) {
      world.remove(rb);
    },
    addConstraint: function(ct) {
      world.addConstraint(ct);
    },
    removeConstraint: function(ct) {
      world.removeConstraint(ct);
    },
    addContactMaterial: function(cm) {
      world.addContactMaterial(cm);
    },
    removeContactMaterial: function(cm) {
      world.removeContactMaterial(cm);
    }
  }
});

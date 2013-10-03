var Prefab = (function() {
  var prefabs = {};

  return {
    define: function(name, ctor) {
      prefabs[name] = ctor; 
    },
    create: function(name) {
      return prefabs[name]();
    }
  }
})();

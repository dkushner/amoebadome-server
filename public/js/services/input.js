var deps = [
  'jquery',
  'vendor/KeyboardState',
  'underscore',
  'vendor/EventEmitter'
];

define(deps, function($, THREEx, _, EventEmitter) {
  var keymap = {
    'W': 'forward',
    'A': 'left',
    'S': 'back',
    'D': 'right',
    'space': 'fire',
    'E': 'use',
    'Q': 'query'
  };
  var keys = THREEx.KeyboardState();

  return _.extend({
    initialize: function(extended) {
      keymap = _.extend(keymap, extended || {});

      $(document)
      .on("mousemove", $.proxy(function(e) {
        this.emitEvent('pointer.move', [e.pageX, e.pageY]);
      }, this))
      .on("mousedown", $.proxy(function(e) {
        this.emitEvent('pointer.down', [e.pageX, e.pageY]);
      }, this));
    },
    _tick: function() {
      window.requestAnimationFrame(this._tick.bind(this));
      _.each(_.pairs(this.keymap), function(el) {
        if(keys.pressed(el[0])) {
          this.emitEvent(el[1]);
        }
      }, this);
    }
  }, EventEmitter.prototype);
});

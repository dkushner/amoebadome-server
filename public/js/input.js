var InputService = Class.create(EventEmitter.prototype, {
  keymap: {
    'W': 'forward',
    'A': 'left',
    'S': 'back',
    'D': 'right',
    'space': 'fire',
    'E': 'use',
    'Q': 'query'
  },
  initialize: function(keys) {
    this._keys = new THREEx.KeyboardState();
    this.keymap = _.extend(this.keymap, keys || {});
    this._tick();
          
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
      if(this._keys.pressed(el[0])) {
        this.emitEvent(el[1]);
      }
    }, this);
  }
});

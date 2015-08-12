var R = require('ramda');


module.exports = {

  baseMap: function(f) {
    return f(this.value);
  },

  getEquals: function(constructor) {
    return function equals(that) {
      return that instanceof constructor && R.equals(this.value, that.value);
    };
  },

  extend: function(Child, Parent) {
    function Ctor() {
      this.constructor = Child;
    }
    Ctor.prototype = Parent.prototype;
    Child.prototype = new Ctor();
    Child.super_ = Parent.prototype;
  },

  identity: function(x) { return x; },

  notImplemented: function(str) {
    return function() {
      throw new Error(str + ' is not implemented');
    };
  },

  notCallable: function(fn) {
    return function() {
      throw new Error(fn + ' cannot be called directly');
    };
  },

  returnThis: function() { return this; },

  attachMethods: function(type) {
    var methods = R.intersection([
      'equals',
      'concat',
      'empty',
      'map',
      'ap',
      'of',
      'reduce',
      'sequence',
      'chain',
      'extend',
      'extract',
      'toString'
    ], R.keys(type));

    return R.reduce(function(t, methodName) {
      if (!R.has(methodName, t.prototype)) {
        t.prototype[methodName] = function () {
          return R.partialRight(t[methodName], this).apply(null, arguments);
        };
      }
      return t;
    }, type, methods);
  }
};

var R = require('ramda');

var Type = require('./Type');
var attachMethods = require('./internal/util').attachMethods;


var Identity = Type.product('get');

Identity.of = Identity;
Identity.prototype.of = Identity;

Identity.map = R.curry(function(f, i) {
  return i.unapply(function(v) {
    return Identity(f(v));
  });
});

Identity.ap = R.curry(function(iF, iX) {
  return iF.unapply(Identity.map(R.__, iX));
});

Identity.prototype.ap = function(x) {
  return Identity.ap(this, x);
}

Identity.chain = R.curry(function(f, i) {
  return i.unapply(f);
});

Identity.toString = function(i) {
  return 'Identity(' + i.unapply(R.toString) + ')';
};

Identity.equals = R.curry(function(i1, i2) {
  return i1 instanceof Identity && i2 instanceof Identity &&
         i1.unapply(i2.unapply(R.equals));
});

module.exports = attachMethods(Identity);

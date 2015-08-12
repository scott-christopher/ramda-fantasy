var R = require('ramda');
var Type = require('./Type');
var attachMethods = require('./internal/util').attachMethods;


var Tuple = Type.product('_1', '_2');

function ensureConcat(xs) {
  xs.forEach(function(x) {
    if (typeof x.concat != 'function') {
      throw new TypeError(R.toString(x) + ' must be a semigroup to perform this operation');
    }
  });
}

Tuple.fst = function(x) {
  return x.unapply(R.nthArg(0));
};

Tuple.snd = function(x) {
  return x.unapply(R.nthArg(1));
};

Tuple.concat = R.curry(function concat(t1, t2) {
  ensureConcat([t1._1(), t1._2(), t2._1(), t2._2()]);
  return Tuple(t1._1().concat(t2._1()), t1._2().concat(t2._2()));
});

Tuple.prototype.concat = function concat(otherT) {
  return Tuple.concat(this, otherT);
};

Tuple.map = R.over(Tuple._2);

Tuple.ap = R.curry(function ap(tf, tx) {
  ensureConcat([tf._1(), tx._1()]);
  return Tuple(tf._1().concat(tx._1()), tf._2()(tx._2()));
});

Tuple.prototype.ap = function ap(x) {
  return Tuple.ap(this, x);
};

Tuple.equals = R.curry(function equals(t1, t2) {
  return t1 instanceof Tuple &&
         t2 instanceof Tuple &&
         R.equals(t1._1(), t2._1()) &&
         R.equals(t1._2(), t2._2());
});

Tuple.toString = function toString(t) {
  return 'Tuple(' + R.toString(t._1()) + ', ' + R.toString(t._2()) + ')';
};

module.exports = attachMethods(Tuple);

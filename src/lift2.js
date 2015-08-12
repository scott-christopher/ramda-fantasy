var R = require('ramda');

module.exports = R.curryN(3, function liftA2(f, a1, a2) {
  var aF = a1.map(f);
  return aF.ap(a2);
});

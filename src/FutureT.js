var R = require('ramda');
var Identity = require('./Identity');


var Future = T(Identity);
Future.T = T;

Future.prototype.fork = function(reject, resolve) {
  try {
    this._fork(
      function(x) {
        return reject(x.get());
      },
      function(x) {
        return resolve(x.get());
      }
    );
  } catch(e) {
    reject(e);
  }
};

Future.prototype.toString = function() {
  return 'Future(' + R.toString(this._fork) + ')';
};

Future.memoize = function(f) {
  var status = 'IDLE';
  var listeners = [];
  var cachedValue;

  var handleCompletion = R.curry(function(newStatus, cb, val) {
    status = newStatus;
    cachedValue = val;
    cb(val);
    R.forEach(function(listener) {
      listener[status](cachedValue);
    }, listeners);
  });

  function addListeners(reject, resolve) {
    listeners.push({ REJECTED: reject, RESOLVED: resolve } );
  }

  function doResolve(reject, resolve) {
    status = 'PENDING';
    return f._fork(
      handleCompletion('REJECTED', reject),
      handleCompletion('RESOLVED', resolve)
    );
  }

  return new Future(function(reject, resolve) {

    switch(status) {
      case 'IDLE': doResolve(reject, resolve); break;
      case 'PENDING': addListeners(reject, resolve); break;
      case 'REJECTED': reject(cachedValue); break;
      case 'RESOLVED': resolve(cachedValue); break;
    }

  });
};


function T(M) {
  var FutureT = function FutureT(f) {
    if (!(this instanceof FutureT)) {
      return new FutureT(f);
    }
    this._fork = f;
  };

  FutureT.prototype.of = FutureT.of = function of(a) {
    return FutureT(function(_, resolve) {
      return resolve(M.of(a));
    });
  };

  FutureT.prototype.chain = function chain(f) {
    var futureT = this;
    return FutureT(function (reject, resolve) {
      function resolved(m) {
        return m.chain(function (a) {
          return f(a)._fork(reject, resolve);
        });
      }
      return futureT._fork(reject, resolved);
    });
  };

  FutureT.prototype.chainReject = function(f) {
    var futureT = this;
    return FutureT(function (reject, resolve) {
      function rejected(m) {
        return m.chain(function (a) {
          return f(a)._fork(reject, resolve);
        });
      }
      return futureT._fork(rejected, resolve);
    });
  };

  FutureT.prototype.bimap = function(errFn, successFn) {
    var futureT = this;
    return new FutureT(function(reject, resolve) {
      futureT._fork(function(m) {
        reject(m.map(errFn));
      }, function(m) {
        resolve(m.map(successFn));
      });
    });
  };

  FutureT.reject = function(val) {
    return new FutureT(function(reject) {
      reject(M.of(val));
    });
  };

  FutureT.prototype.toString = function() {
    return 'FutureT[' + M.name + '](' + R.toString(this._fork) + ')';
  };

  FutureT.prototype.map = function map(f) {
    return this.chain(function(a) { return FutureT.of(f(a)); });
  };

  FutureT.prototype.ap = function ap(m) {
    return this.chain(function(f) { return m.map(f); });
  };

  FutureT.prototype.fork = function(reject, resolve) {
    return this._fork(reject, resolve);
  }

  return FutureT;
}

module.exports = Future;

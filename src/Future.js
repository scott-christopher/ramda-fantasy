var R = require('ramda');
var Type = require('./Type');
var attachMethods = require('./internal/util').attachMethods;


var Future = Type.product('f');

Future.fork = R.curry(function(reject, resolve, future) {
  try {
    future.unapply(function(f) {
      f(reject, resolve);
    });
  } catch(e) {
    reject(e);
  }
});

Future.prototype.fork = function(reject, resolve) {
  return Future.fork(reject, resolve, this);
};

Future.map = R.curry(function(f, future) {
  return Future.chain(function(a) {
    return Future.of(f(a));
  }, future);
});

Future.ap = R.curry(function(fF, fX) {
  return Future(function(rej, res) {
    var applyFn, val;
    var doReject = R.once(rej);

    function resolveIfDone() {
      if (applyFn != null && val != null) {
        return res(applyFn(val));
      }
    }

    fF.fork(doReject, function(fn) {
      applyFn = fn;
      resolveIfDone();
    });

    fX.fork(doReject, function(v) {
      val = v;
      resolveIfDone();
    });
  });
});

Future.prototype.ap = function(fX) {
  return Future.ap(this, fX);
};

Future.of = function(x) {
  return Future(function(_, resolve) { return resolve(x); });
};

Future.chain = R.curry(function(f, future) {
  return Future(function(reject, resolve) {
    return Future.fork(reject, function(x) {
      return Future.fork(reject, resolve, f(x));
    }, future);
  });
});

Future.chainReject = R.curry(function(f, future) {
  return Future(function(reject, resolve) {
    return Future.fork(function(x) {
      return Future.fork(reject, resolve, f(x));
    }, resolve, future);
  });
});

Future.prototype.chainReject = function(f) {
  return Future.chainReject(f, this);
};

Future.bimap = R.curry(function(errFn, successFn, future) {
  return Future(function(reject, resolve) {
    return Future.fork(
      R.compose(reject, errFn),
      R.compose(resolve, successFn),
      future
    );
  });
});

Future.prototype.bimap = function(errFn, successFn) {
  return Future.bimap(errFn, successFn, this);
};

Future.reject = function(val) {
  return Future(function(reject) {
    reject(val);
  });
};

Future.toString = function(future) {
  return 'Future(' + future.unapply(R.toString) + ')';
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
    return f.fork(
      handleCompletion('REJECTED', reject),
      handleCompletion('RESOLVED', resolve)
    );
  }

  return Future(function(reject, resolve) {

    switch(status) {
      case 'IDLE': doResolve(reject, resolve); break;
      case 'PENDING': addListeners(reject, resolve); break;
      case 'REJECTED': reject(cachedValue); break;
      case 'RESOLVED': resolve(cachedValue); break;
    }

  });
};

module.exports = attachMethods(Future);

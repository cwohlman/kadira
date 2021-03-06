
Tinytest.add(
  'Errors - Meteor._debug - track with Meteor._debug',
  function (test) {
    var originalErrorTrackingStatus = Kadira.options.enableErrorTracking;
    Kadira.enableErrorTracking();
    Kadira.models.error = new ErrorModel('foo');
    Meteor._debug('_debug', '_stack');
    var payload = Kadira.models.error.buildPayload();
    var error = payload.errors[0];
    var expected = {
      appId: "foo",
      name: "_debug",
      subType: "Meteor._debug",
      // startTime: 1408098721327,
      type: "server-internal",
      trace: {
        type: "server-internal",
        name: "_debug",
        subType: "Meteor._debug",
        errored: true,
        // at: 1408098721326,
        events: [
          ["start", 0, {}],
          ["error", 0, {error: {message: "_debug", stack: "_stack"}}]
        ],
        metrics: {total: 0}
      },
      stacks: [{stack: "_stack"}],
      count: 1
    }

    delete error.startTime;
    delete error.trace.at;
    test.equal(expected, error);
    _resetErrorTracking(originalErrorTrackingStatus);
  }
);

Tinytest.add(
  'Errors - Meteor._debug - do not track method errors',
  function (test) {
    var originalErrorTrackingStatus = Kadira.options.enableErrorTracking;
    Kadira.enableErrorTracking();
    Kadira.models.error = new ErrorModel('foo');
    var method = RegisterMethod(causeError);
    var client = GetMeteorClient();

    try {
      var result = client.call(method);
    } catch (e) {
      // ignore the error
    }

    var payload = Kadira.models.error.buildPayload();
    var error = payload.errors[0];
    test.equal(1, payload.errors.length);
    test.equal(error.type, 'method');
    test.equal(error.subType, method);
    _resetErrorTracking(originalErrorTrackingStatus);

    function causeError () {
      HTTP.call('POST', 'localhost', Function());
    }
  }
);

Tinytest.addAsync(
  'Errors - Meteor._debug - do not track pubsub errors',
  function (test, done) {
    var originalErrorTrackingStatus = Kadira.options.enableErrorTracking;
    Kadira.enableErrorTracking();
    Kadira.models.error = new ErrorModel('foo');
    var pubsub = RegisterPublication(causeError);
    var client = GetMeteorClient();
    var result = client.subscribe(pubsub, {onError: function () {
      var payload = Kadira.models.error.buildPayload();
      var error = payload.errors[0];
      test.equal(1, payload.errors.length);
      test.equal(error.type, 'sub');
      test.equal(error.subType, pubsub);
      _resetErrorTracking(originalErrorTrackingStatus);
      done();
    }});

    function causeError () {
      HTTP.call('POST', 'localhost', Function());
    }
  }
);

function _resetErrorTracking (status) {
  if(status) {
    Kadira.enableErrorTracking();
  } else {
    Kadira.disableErrorTracking();
  }
}

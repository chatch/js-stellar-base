"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodeBase58Check = decodeBase58Check;

var _bs = require("./vendor/bs58");

var _bs2 = _interopRequireDefault(_bs);

var _isUndefined = require("lodash/isUndefined");

var _isUndefined2 = _interopRequireDefault(_isUndefined);

var _isNull = require("lodash/isNull");

var _isNull2 = _interopRequireDefault(_isNull);

var _hashing = require("./hashing");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var versionBytes = {
  "accountId": 0x00, // decimal 0
  "none": 0x01, // decimal 1
  "seed": 0x21 // decimal 33
};

function decodeBase58Check(versionByteName, encoded) {
  var decoded = _bs2.default.decode(encoded);
  var versionByte = decoded[0];
  var payload = decoded.slice(0, decoded.length - 4);
  var data = payload.slice(1);
  var checksum = decoded.slice(decoded.length - 4);

  var expectedVersion = versionBytes[versionByteName];

  if ((0, _isUndefined2.default)(expectedVersion)) {
    throw new Error(versionByteName + " is not a valid version byte name.  expected one of \"accountId\", \"seed\", or \"none\"");
  }

  if (versionByte !== expectedVersion) {
    throw new Error("invalid version byte.  expected " + expectedVersion + ", got " + versionByte);
  }

  var expectedChecksum = calculateChecksum(payload);

  if (!verifyChecksum(expectedChecksum, checksum)) {
    throw new Error("invalid checksum");
  }

  if (versionByteName === 'accountId' && decoded.length !== 37) {
    throw new Error("Decoded address length is invalid. Expected 37, got " + decoded.length);
  }

  return new Buffer(data);
}

function calculateChecksum(payload) {
  var inner = (0, _hashing.hash)(payload);
  var outer = (0, _hashing.hash)(inner);
  return outer.slice(0, 4);
}

function verifyChecksum(expected, actual) {
  if (expected.length !== actual.length) {
    return false;
  }

  if (expected.length === 0) {
    return true;
  }

  for (var i = 0; i < expected.length; i++) {
    if (expected[i] !== actual[i]) {
      return false;
    }
  }

  return true;
}
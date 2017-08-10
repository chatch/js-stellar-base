"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Memo = exports.MemoReturn = exports.MemoHash = exports.MemoText = exports.MemoID = exports.MemoNone = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stellarXdr_generated = require("./generated/stellar-xdr_generated");

var _stellarXdr_generated2 = _interopRequireDefault(_stellarXdr_generated);

var _isUndefined = require("lodash/isUndefined");

var _isUndefined2 = _interopRequireDefault(_isUndefined);

var _isNull = require("lodash/isNull");

var _isNull2 = _interopRequireDefault(_isNull);

var _isString = require("lodash/isString");

var _isString2 = _interopRequireDefault(_isString);

var _clone = require("lodash/clone");

var _clone2 = _interopRequireDefault(_clone);

var _jsXdr = require("js-xdr");

var _bignumber = require("bignumber.js");

var _bignumber2 = _interopRequireDefault(_bignumber);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Type of {@link Memo}.
 */
var MemoNone = exports.MemoNone = "none";
/**
 * Type of {@link Memo}.
 */
var MemoID = exports.MemoID = "id";
/**
 * Type of {@link Memo}.
 */
var MemoText = exports.MemoText = "text";
/**
 * Type of {@link Memo}.
 */
var MemoHash = exports.MemoHash = "hash";
/**
 * Type of {@link Memo}.
 */
var MemoReturn = exports.MemoReturn = "return";

/**
 * `Memo` represents memos attached to transactions.
 *
 * @param {string} type - `MemoNone`, `MemoID`, `MemoText`, `MemoHash` or `MemoReturn`
 * @param {*} value - `string` for `MemoID`, `MemoText`, buffer of hex string for `MemoHash` or `MemoReturn`
 * @see [Transactions concept](https://www.stellar.org/developers/learn/concepts/transactions.html)
 * @class Memo
 */

var Memo = function () {
  function Memo(type) {
    var value = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, Memo);

    this._type = type;
    this._value = value;

    switch (this._type) {
      case MemoNone:
        break;
      case MemoID:
        Memo._validateIdValue(value);
        break;
      case MemoText:
        Memo._validateTextValue(value);
        break;
      case MemoHash:
      case MemoReturn:
        Memo._validateHashValue(value);
        // We want MemoHash and MemoReturn to have Buffer as a value
        if ((0, _isString2.default)(value)) {
          this._value = new Buffer(value, 'hex');
        }
        break;
      default:
        throw new Error("Invalid memo type");
    }
  }

  /**
   * Contains memo type: `MemoNone`, `MemoID`, `MemoText`, `MemoHash` or `MemoReturn`
   */


  _createClass(Memo, [{
    key: "toXDRObject",


    /**
     * Returns XDR memo object.
     * @returns {xdr.Memo}
     */
    value: function toXDRObject() {
      switch (this._type) {
        case MemoNone:
          return _stellarXdr_generated2.default.Memo.memoNone();
        case MemoID:
          return _stellarXdr_generated2.default.Memo.memoId(_jsXdr.UnsignedHyper.fromString(this._value));
        case MemoText:
          return _stellarXdr_generated2.default.Memo.memoText(this._value);
        case MemoHash:
          return _stellarXdr_generated2.default.Memo.memoHash(this._value);
        case MemoReturn:
          return _stellarXdr_generated2.default.Memo.memoReturn(this._value);
      }
    }

    /**
     * Returns {@link Memo} from XDR memo object.
     * @param {xdr.Memo}
     * @returns {Memo}
     */

  }, {
    key: "type",
    get: function get() {
      return (0, _clone2.default)(this._type);
    },
    set: function set(type) {
      throw new Error("Memo is immutable");
    }

    /**
     * Contains memo value:
     * * `null` for `MemoNone`,
     * * `string` for `MemoID`, `MemoText`,
     * * `Buffer` for `MemoHash`, `MemoReturn`
     */

  }, {
    key: "value",
    get: function get() {
      switch (this._type) {
        case MemoNone:
          return null;
        case MemoID:
        case MemoText:
          return (0, _clone2.default)(this._value);
        case MemoHash:
        case MemoReturn:
          return new Buffer(this._value);
        default:
          throw new Error("Invalid memo type");
      }
    },
    set: function set(value) {
      throw new Error("Memo is immutable");
    }
  }], [{
    key: "_validateIdValue",
    value: function _validateIdValue(value) {
      var error = new Error("Expects a int64 as a string. Got " + value);

      if (!(0, _isString2.default)(value)) {
        throw error;
      }

      var number = void 0;
      try {
        number = new _bignumber2.default(value);
      } catch (e) {
        throw error;
      }

      // Infinity
      if (!number.isFinite()) {
        throw error;
      }

      // NaN
      if (number.isNaN()) {
        throw error;
      }
    }
  }, {
    key: "_validateTextValue",
    value: function _validateTextValue(value) {
      if (!(0, _isString2.default)(value)) {
        throw new Error("Expects string type got " + (typeof value === "undefined" ? "undefined" : _typeof(value)));
      }
      if (Buffer.byteLength(value, "utf8") > 28) {
        throw new Error("Text should be <= 28 bytes. Got " + Buffer.byteLength(value, "utf8"));
      }
    }
  }, {
    key: "_validateHashValue",
    value: function _validateHashValue(value) {
      var error = new Error("Expects a 32 byte hash value or hex encoded string. Got " + value);

      if (value === null || (0, _isUndefined2.default)(value)) {
        throw error;
      }

      var valueBuffer = void 0;
      if ((0, _isString2.default)(value)) {
        if (!/^[0-9A-Fa-f]{64}$/g.test(value)) {
          throw error;
        }
        valueBuffer = new Buffer(value, 'hex');
      } else if (Buffer.isBuffer(value)) {
        valueBuffer = new Buffer(value);
      } else {
        throw error;
      }

      if (!valueBuffer.length || valueBuffer.length != 32) {
        throw error;
      }
    }

    /**
     * Returns an empty memo (`MemoNone`).
     * @returns {Memo}
     */

  }, {
    key: "none",
    value: function none() {
      return new Memo(MemoNone);
    }

    /**
     * Creates and returns a `MemoText` memo.
     * @param {string} text - memo text
     * @returns {Memo}
     */

  }, {
    key: "text",
    value: function text(_text) {
      return new Memo(MemoText, _text);
    }

    /**
     * Creates and returns a `MemoID` memo.
     * @param {string} id - 64-bit number represented as a string
     * @returns {Memo}
     */

  }, {
    key: "id",
    value: function id(_id) {
      return new Memo(MemoID, _id);
    }

    /**
     * Creates and returns a `MemoHash` memo.
     * @param {array|string} hash - 32 byte hash or hex encoded string
     * @returns {Memo}
     */

  }, {
    key: "hash",
    value: function hash(_hash) {
      return new Memo(MemoHash, _hash);
    }

    /**
     * Creates and returns a `MemoReturn` memo.
     * @param {array|string} hash - 32 byte hash or hex encoded string
     * @returns {Memo}
     */

  }, {
    key: "return",
    value: function _return(hash) {
      return new Memo(MemoReturn, hash);
    }
  }, {
    key: "fromXDRObject",
    value: function fromXDRObject(object) {
      switch (object.arm()) {
        case "id":
          return Memo.id(object.value().toString());
        case "text":
          return Memo.text(object.value());
        case "hash":
          return Memo.hash(object.value());
        case "retHash":
          return Memo.return(object.value());
      }

      if (typeof object.value() === "undefined") {
        return Memo.none();
      }

      throw new Error("Unknown type");
    }
  }]);

  return Memo;
}();

exports.Memo = Memo;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Asset = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stellarXdr_generated = require("./generated/stellar-xdr_generated");

var _stellarXdr_generated2 = _interopRequireDefault(_stellarXdr_generated);

var _keypair = require("./keypair");

var _strkey = require("./strkey");

var _clone = require("lodash/clone");

var _clone2 = _interopRequireDefault(_clone);

var _padEnd = require("lodash/padEnd");

var _padEnd2 = _interopRequireDefault(_padEnd);

var _trimEnd = require("lodash/trimEnd");

var _trimEnd2 = _interopRequireDefault(_trimEnd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Asset = exports.Asset = function () {
  /**
   * Asset class represents an asset, either the native asset (`XLM`)
   * or a asset code / issuer account ID pair.
   *
   * An asset code describes an asset code and issuer pair. In the case of the native
   * asset XLM, the issuer will be null.
   *
   * @constructor
   * @param {string} code - The asset code.
   * @param {string} issuer - The account ID of the issuer.
   */
  function Asset(code, issuer) {
    _classCallCheck(this, Asset);

    if (!/^[a-zA-Z0-9]{1,12}$/.test(code)) {
      throw new Error("Asset code is invalid (maximum alphanumeric, 12 characters at max)");
    }
    if (String(code).toLowerCase() !== "xlm" && !issuer) {
      throw new Error("Issuer cannot be null");
    }
    if (issuer && !_strkey.StrKey.isValidEd25519PublicKey(issuer)) {
      throw new Error("Issuer is invalid");
    }

    this.code = code;
    this.issuer = issuer;
  }

  /**
   * Returns an asset object for the native asset.
   * @Return {Asset}
   */


  _createClass(Asset, [{
    key: "toXDRObject",


    /**
     * Returns the xdr object for this asset.
     * @returns {xdr.Asset}
     */
    value: function toXDRObject() {
      if (this.isNative()) {
        return _stellarXdr_generated2.default.Asset.assetTypeNative();
      } else {
        var xdrType = void 0,
            xdrTypeString = void 0;
        if (this.code.length <= 4) {
          xdrType = _stellarXdr_generated2.default.AssetAlphaNum4;
          xdrTypeString = 'assetTypeCreditAlphanum4';
        } else {
          xdrType = _stellarXdr_generated2.default.AssetAlphaNum12;
          xdrTypeString = 'assetTypeCreditAlphanum12';
        }

        // pad code with null bytes if necessary
        var padLength = this.code.length <= 4 ? 4 : 12;
        var paddedCode = (0, _padEnd2.default)(this.code, padLength, '\0');

        var assetType = new xdrType({
          assetCode: paddedCode,
          issuer: _keypair.Keypair.fromPublicKey(this.issuer).xdrAccountId()
        });

        return new _stellarXdr_generated2.default.Asset(xdrTypeString, assetType);
      }
    }

    /**
     * Return the asset code
     * @returns {string}
     */

  }, {
    key: "getCode",
    value: function getCode() {
      return (0, _clone2.default)(this.code);
    }

    /**
     * Return the asset issuer
     * @returns {string}
     */

  }, {
    key: "getIssuer",
    value: function getIssuer() {
      return (0, _clone2.default)(this.issuer);
    }

    /**
     * Return the asset type. Can be one of following types:
     *
     * * `native`
     * * `credit_alphanum4`
     * * `credit_alphanum12`
     *
     * @see [Assets concept](https://www.stellar.org/developers/learn/concepts/assets.html)
     * @returns {string}
     */

  }, {
    key: "getAssetType",
    value: function getAssetType() {
      if (this.isNative()) {
        return 'native';
      } else {
        if (this.code.length >= 1 && this.code.length <= 4) {
          return "credit_alphanum4";
        } else if (this.code.length >= 5 && this.code.length <= 12) {
          return "credit_alphanum12";
        }
      }
    }

    /**
     * Returns true if this asset object is the native asset.
     * @returns {boolean}
     */

  }, {
    key: "isNative",
    value: function isNative() {
      return !this.issuer;
    }

    /**
     * Returns true if this asset equals the given asset.
     * @param {Asset} asset Asset to compare
     * @returns {boolean}
     */

  }, {
    key: "equals",
    value: function equals(asset) {
      return this.code == asset.getCode() && this.issuer == asset.getIssuer();
    }
  }], [{
    key: "native",
    value: function native() {
      return new Asset("XLM");
    }

    /**
     * Returns an asset object from its XDR object representation.
     * @param {xdr.Asset} assetXdr - The asset xdr object.
     * @returns {Asset}
     */

  }, {
    key: "fromOperation",
    value: function fromOperation(assetXdr) {
      var anum = void 0,
          code = void 0,
          issuer = void 0;
      switch (assetXdr.switch()) {
        case _stellarXdr_generated2.default.AssetType.assetTypeNative():
          return this.native();
        case _stellarXdr_generated2.default.AssetType.assetTypeCreditAlphanum4():
          anum = assetXdr.alphaNum4();
          issuer = _strkey.StrKey.encodeEd25519PublicKey(anum.issuer().ed25519());
          code = (0, _trimEnd2.default)(anum.assetCode(), '\0');
          return new this(code, issuer);
        case _stellarXdr_generated2.default.AssetType.assetTypeCreditAlphanum12():
          anum = assetXdr.alphaNum12();
          issuer = _strkey.StrKey.encodeEd25519PublicKey(anum.issuer().ed25519());
          code = (0, _trimEnd2.default)(anum.assetCode(), '\0');
          return new this(code, issuer);
        default:
          throw new Error("Invalid asset type: " + assetXdr.switch().name);
      }
    }
  }]);

  return Asset;
}();
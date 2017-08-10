"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Operation = exports.AuthImmutableFlag = exports.AuthRevocableFlag = exports.AuthRequiredFlag = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stellarXdr_generated = require("./generated/stellar-xdr_generated");

var _stellarXdr_generated2 = _interopRequireDefault(_stellarXdr_generated);

var _keypair = require("./keypair");

var _jsXdr = require("js-xdr");

var _hashing = require("./hashing");

var _strkey = require("./strkey");

var _asset = require("./asset");

var _bignumber = require("bignumber.js");

var _bignumber2 = _interopRequireDefault(_bignumber);

var _continued_fraction = require("./util/continued_fraction");

var _padEnd = require("lodash/padEnd");

var _padEnd2 = _interopRequireDefault(_padEnd);

var _trimEnd = require("lodash/trimEnd");

var _trimEnd2 = _interopRequireDefault(_trimEnd);

var _isEmpty = require("lodash/isEmpty");

var _isEmpty2 = _interopRequireDefault(_isEmpty);

var _isUndefined = require("lodash/isUndefined");

var _isUndefined2 = _interopRequireDefault(_isUndefined);

var _isString = require("lodash/isString");

var _isString2 = _interopRequireDefault(_isString);

var _isNumber = require("lodash/isNumber");

var _isNumber2 = _interopRequireDefault(_isNumber);

var _isFinite = require("lodash/isFinite");

var _isFinite2 = _interopRequireDefault(_isFinite);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ONE = 10000000;
var MAX_INT64 = '9223372036854775807';

/**
 * When set using `{@link Operation.setOptions}` option, requires the issuing account to
 * give other accounts permission before they can hold the issuing account’s credit.
 * @constant
 * @see [Account flags](https://www.stellar.org/developers/guides/concepts/accounts.html#flags)
 */
var AuthRequiredFlag = exports.AuthRequiredFlag = 1 << 0;
/**
 * When set using `{@link Operation.setOptions}` option, allows the issuing account to
 * revoke its credit held by other accounts.
 * @constant
 * @see [Account flags](https://www.stellar.org/developers/guides/concepts/accounts.html#flags)
 */
var AuthRevocableFlag = exports.AuthRevocableFlag = 1 << 1;
/**
 * When set using `{@link Operation.setOptions}` option, then none of the authorization flags
 * can be set and the account can never be deleted.
 * @constant
 * @see [Account flags](https://www.stellar.org/developers/guides/concepts/accounts.html#flags)
 */
var AuthImmutableFlag = exports.AuthImmutableFlag = 1 << 2;

/**
 * `Operation` class represents [operations](https://www.stellar.org/developers/learn/concepts/operations.html) in Stellar network.
 * Use one of static methods to create operations:
 * * `{@link Operation.createAccount}`
 * * `{@link Operation.payment}`
 * * `{@link Operation.pathPayment}`
 * * `{@link Operation.manageOffer}`
 * * `{@link Operation.createPassiveOffer}`
 * * `{@link Operation.setOptions}`
 * * `{@link Operation.changeTrust}`
 * * `{@link Operation.allowTrust}`
 * * `{@link Operation.accountMerge}`
 * * `{@link Operation.inflation}`
 * * `{@link Operation.manageData}`
 *
 * @class Operation
 */

var Operation = exports.Operation = function () {
  function Operation() {
    _classCallCheck(this, Operation);
  }

  _createClass(Operation, null, [{
    key: "createAccount",

    /**
     * Create and fund a non existent account.
     * @param {object} opts
     * @param {string} opts.destination - Destination account ID to create an account for.
     * @param {string} opts.startingBalance - Amount in XLM the account should be funded for. Must be greater
     *                                   than the [reserve balance amount](https://www.stellar.org/developers/learn/concepts/fees.html).
     * @param {string} [opts.source] - The source account for the payment. Defaults to the transaction's source account.
     * @returns {xdr.CreateAccountOp}
     */
    value: function createAccount(opts) {
      if (!_strkey.StrKey.isValidEd25519PublicKey(opts.destination)) {
        throw new Error("destination is invalid");
      }
      if (!this.isValidAmount(opts.startingBalance)) {
        throw new TypeError(Operation.constructAmountRequirementsError('startingBalance'));
      }
      var attributes = {};
      attributes.destination = _keypair.Keypair.fromPublicKey(opts.destination).xdrAccountId();
      attributes.startingBalance = this._toXDRAmount(opts.startingBalance);
      var createAccount = new _stellarXdr_generated2.default.CreateAccountOp(attributes);

      var opAttributes = {};
      opAttributes.body = _stellarXdr_generated2.default.OperationBody.createAccount(createAccount);
      this.setSourceAccount(opAttributes, opts);

      return new _stellarXdr_generated2.default.Operation(opAttributes);
    }

    /**
     * Create a payment operation.
     * @param {object} opts
     * @param {string} opts.destination - The destination account ID.
     * @param {Asset} opts.asset - The asset to send.
     * @param {string} opts.amount - The amount to send.
     * @param {string} [opts.source] - The source account for the payment. Defaults to the transaction's source account.
     * @returns {xdr.PaymentOp}
     */

  }, {
    key: "payment",
    value: function payment(opts) {
      if (!_strkey.StrKey.isValidEd25519PublicKey(opts.destination)) {
        throw new Error("destination is invalid");
      }
      if (!opts.asset) {
        throw new Error("Must provide an asset for a payment operation");
      }
      if (!this.isValidAmount(opts.amount)) {
        throw new TypeError(Operation.constructAmountRequirementsError('amount'));
      }

      var attributes = {};
      attributes.destination = _keypair.Keypair.fromPublicKey(opts.destination).xdrAccountId();
      attributes.asset = opts.asset.toXDRObject();
      attributes.amount = this._toXDRAmount(opts.amount);
      var payment = new _stellarXdr_generated2.default.PaymentOp(attributes);

      var opAttributes = {};
      opAttributes.body = _stellarXdr_generated2.default.OperationBody.payment(payment);
      this.setSourceAccount(opAttributes, opts);

      return new _stellarXdr_generated2.default.Operation(opAttributes);
    }

    /**
     * Returns a XDR PaymentOp. A "payment" operation send the specified amount to the
     * destination account, optionally through a path. XLM payments create the destination
     * account if it does not exist.
     * @param {object} opts
     * @param {Asset} opts.sendAsset - The asset to pay with.
     * @param {string} opts.sendMax - The maximum amount of sendAsset to send.
     * @param {string} opts.destination - The destination account to send to.
     * @param {Asset} opts.destAsset - The asset the destination will receive.
     * @param {string} opts.destAmount - The amount the destination receives.
     * @param {Asset[]} opts.path - An array of Asset objects to use as the path.
     * @param {string} [opts.source] - The source account for the payment. Defaults to the transaction's source account.
     * @returns {xdr.PathPaymentOp}
     */

  }, {
    key: "pathPayment",
    value: function pathPayment(opts) {
      if (!opts.sendAsset) {
        throw new Error("Must specify a send asset");
      }
      if (!this.isValidAmount(opts.sendMax)) {
        throw new TypeError(Operation.constructAmountRequirementsError('sendMax'));
      }
      if (!_strkey.StrKey.isValidEd25519PublicKey(opts.destination)) {
        throw new Error("destination is invalid");
      }
      if (!opts.destAsset) {
        throw new Error("Must provide a destAsset for a payment operation");
      }
      if (!this.isValidAmount(opts.destAmount)) {
        throw new TypeError(Operation.constructAmountRequirementsError('destAmount'));
      }

      var attributes = {};
      attributes.sendAsset = opts.sendAsset.toXDRObject();
      attributes.sendMax = this._toXDRAmount(opts.sendMax);
      attributes.destination = _keypair.Keypair.fromPublicKey(opts.destination).xdrAccountId();
      attributes.destAsset = opts.destAsset.toXDRObject();
      attributes.destAmount = this._toXDRAmount(opts.destAmount);

      var path = opts.path ? opts.path : [];
      attributes.path = [];
      for (var i in path) {
        attributes.path.push(path[i].toXDRObject());
      }

      var payment = new _stellarXdr_generated2.default.PathPaymentOp(attributes);

      var opAttributes = {};
      opAttributes.body = _stellarXdr_generated2.default.OperationBody.pathPayment(payment);
      this.setSourceAccount(opAttributes, opts);

      return new _stellarXdr_generated2.default.Operation(opAttributes);
    }

    /**
     * Returns an XDR ChangeTrustOp. A "change trust" operation adds, removes, or updates a
     * trust line for a given asset from the source account to another. The issuer being
     * trusted and the asset code are in the given Asset object.
     * @param {object} opts
     * @param {Asset} opts.asset - The asset for the trust line.
     * @param {string} [opts.limit] - The limit for the asset, defaults to max int64.
     *                                If the limit is set to "0" it deletes the trustline.
     * @param {string} [opts.source] - The source account (defaults to transaction source).
     * @returns {xdr.ChangeTrustOp}
     */

  }, {
    key: "changeTrust",
    value: function changeTrust(opts) {
      var attributes = {};
      attributes.line = opts.asset.toXDRObject();
      if (!(0, _isUndefined2.default)(opts.limit) && !this.isValidAmount(opts.limit, true)) {
        throw new TypeError(Operation.constructAmountRequirementsError('limit'));
      }

      if (opts.limit) {
        attributes.limit = this._toXDRAmount(opts.limit);
      } else {
        attributes.limit = _jsXdr.Hyper.fromString(new _bignumber2.default(MAX_INT64).toString());
      }

      if (opts.source) {
        attributes.source = opts.source ? opts.source.masterKeypair : null;
      }
      var changeTrustOP = new _stellarXdr_generated2.default.ChangeTrustOp(attributes);

      var opAttributes = {};
      opAttributes.body = _stellarXdr_generated2.default.OperationBody.changeTrust(changeTrustOP);
      this.setSourceAccount(opAttributes, opts);

      return new _stellarXdr_generated2.default.Operation(opAttributes);
    }

    /**
     * Returns an XDR AllowTrustOp. An "allow trust" operation authorizes another
     * account to hold your account's credit for a given asset.
     * @param {object} opts
     * @param {string} opts.trustor - The trusting account (the one being authorized)
     * @param {string} opts.assetCode - The asset code being authorized.
     * @param {boolean} opts.authorize - True to authorize the line, false to deauthorize.
     * @param {string} [opts.source] - The source account (defaults to transaction source).
     * @returns {xdr.AllowTrustOp}
     */

  }, {
    key: "allowTrust",
    value: function allowTrust(opts) {
      if (!_strkey.StrKey.isValidEd25519PublicKey(opts.trustor)) {
        throw new Error("trustor is invalid");
      }
      var attributes = {};
      attributes.trustor = _keypair.Keypair.fromPublicKey(opts.trustor).xdrAccountId();
      if (opts.assetCode.length <= 4) {
        var code = (0, _padEnd2.default)(opts.assetCode, 4, '\0');
        attributes.asset = _stellarXdr_generated2.default.AllowTrustOpAsset.assetTypeCreditAlphanum4(code);
      } else if (opts.assetCode.length <= 12) {
        var _code = (0, _padEnd2.default)(opts.assetCode, 12, '\0');
        attributes.asset = _stellarXdr_generated2.default.AllowTrustOpAsset.assetTypeCreditAlphanum12(_code);
      } else {
        throw new Error("Asset code must be 12 characters at max.");
      }
      attributes.authorize = opts.authorize;
      var allowTrustOp = new _stellarXdr_generated2.default.AllowTrustOp(attributes);

      var opAttributes = {};
      opAttributes.body = _stellarXdr_generated2.default.OperationBody.allowTrust(allowTrustOp);
      this.setSourceAccount(opAttributes, opts);

      return new _stellarXdr_generated2.default.Operation(opAttributes);
    }

    /**
     * Returns an XDR SetOptionsOp. A "set options" operations set or clear account flags,
     * set the account's inflation destination, and/or add new signers to the account.
     * The flags used in `opts.clearFlags` and `opts.setFlags` can be the following:
     *   - `{@link AuthRequiredFlag}`
     *   - `{@link AuthRevocableFlag}`
     *   - `{@link AuthImmutableFlag}`
     *
     * It's possible to set/clear multiple flags at once using logical or.
     * @param {object} opts
     * @param {string} [opts.inflationDest] - Set this account ID as the account's inflation destination.
     * @param {(number|string)} [opts.clearFlags] - Bitmap integer for which account flags to clear.
     * @param {(number|string)} [opts.setFlags] - Bitmap integer for which account flags to set.
     * @param {number|string} [opts.masterWeight] - The master key weight.
     * @param {number|string} [opts.lowThreshold] - The sum weight for the low threshold.
     * @param {number|string} [opts.medThreshold] - The sum weight for the medium threshold.
     * @param {number|string} [opts.highThreshold] - The sum weight for the high threshold.
     * @param {object} [opts.signer] - Add or remove a signer from the account. The signer is
     *                                 deleted if the weight is 0. Only one of `ed25519PublicKey`, `sha256Hash`, `preAuthTx` should be defined.
     * @param {string} [opts.signer.ed25519PublicKey] - The ed25519 public key of the signer.
     * @param {Buffer|string} [opts.signer.sha256Hash] - sha256 hash (Buffer or hex string) of preimage that will unlock funds. Preimage should be used as signature of future transaction.
     * @param {Buffer|string} [opts.signer.preAuthTx] - Hash (Buffer or hex string) of transaction that will unlock funds.
     * @param {number|string} [opts.signer.weight] - The weight of the new signer (0 to delete or 1-255)
     * @param {string} [opts.homeDomain] - sets the home domain used for reverse federation lookup.
     * @param {string} [opts.source] - The source account (defaults to transaction source).
     * @returns {xdr.SetOptionsOp}
     * @see [Account flags](https://www.stellar.org/developers/guides/concepts/accounts.html#flags)
     */

  }, {
    key: "setOptions",
    value: function setOptions(opts) {
      var attributes = {};

      if (opts.inflationDest) {
        if (!_strkey.StrKey.isValidEd25519PublicKey(opts.inflationDest)) {
          throw new Error("inflationDest is invalid");
        }
        attributes.inflationDest = _keypair.Keypair.fromPublicKey(opts.inflationDest).xdrAccountId();
      }

      var weightCheckFunction = function weightCheckFunction(value, name) {
        if (value >= 0 && value <= 255) {
          return true;
        } else {
          throw new Error(name + " value must be between 0 and 255");
        }
      };

      attributes.clearFlags = this._checkUnsignedIntValue("clearFlags", opts.clearFlags);
      attributes.setFlags = this._checkUnsignedIntValue("setFlags", opts.setFlags);
      attributes.masterWeight = this._checkUnsignedIntValue("masterWeight", opts.masterWeight, weightCheckFunction);
      attributes.lowThreshold = this._checkUnsignedIntValue("lowThreshold", opts.lowThreshold, weightCheckFunction);
      attributes.medThreshold = this._checkUnsignedIntValue("medThreshold", opts.medThreshold, weightCheckFunction);
      attributes.highThreshold = this._checkUnsignedIntValue("highThreshold", opts.highThreshold, weightCheckFunction);

      if (!(0, _isUndefined2.default)(opts.homeDomain) && !(0, _isString2.default)(opts.homeDomain)) {
        throw new TypeError('homeDomain argument must be of type String');
      }
      attributes.homeDomain = opts.homeDomain;

      if (opts.signer) {
        var weight = this._checkUnsignedIntValue("signer.weight", opts.signer.weight, weightCheckFunction);
        var key = void 0;

        var setValues = 0;

        if (opts.signer.ed25519PublicKey) {
          if (!_strkey.StrKey.isValidEd25519PublicKey(opts.signer.ed25519PublicKey)) {
            throw new Error("signer.ed25519PublicKey is invalid.");
          }
          var rawKey = _strkey.StrKey.decodeEd25519PublicKey(opts.signer.ed25519PublicKey);
          key = new _stellarXdr_generated2.default.SignerKey.signerKeyTypeEd25519(rawKey);
          setValues++;
        }

        if (opts.signer.preAuthTx) {
          if ((0, _isString2.default)(opts.signer.preAuthTx)) {
            opts.signer.preAuthTx = Buffer.from(opts.signer.preAuthTx, "hex");
          }

          if (!(Buffer.isBuffer(opts.signer.preAuthTx) && opts.signer.preAuthTx.length == 32)) {
            throw new Error("signer.preAuthTx must be 32 bytes Buffer.");
          }
          key = new _stellarXdr_generated2.default.SignerKey.signerKeyTypePreAuthTx(opts.signer.preAuthTx);
          setValues++;
        }

        if (opts.signer.sha256Hash) {
          if ((0, _isString2.default)(opts.signer.sha256Hash)) {
            opts.signer.sha256Hash = Buffer.from(opts.signer.sha256Hash, "hex");
          }

          if (!(Buffer.isBuffer(opts.signer.sha256Hash) && opts.signer.sha256Hash.length == 32)) {
            throw new Error("signer.sha256Hash must be 32 bytes Buffer.");
          }
          key = new _stellarXdr_generated2.default.SignerKey.signerKeyTypeHashX(opts.signer.sha256Hash);
          setValues++;
        }

        if (setValues != 1) {
          throw new Error("Signer object must contain exactly one of signer.ed25519PublicKey, signer.sha256Hash, signer.preAuthTx.");
        }

        attributes.signer = new _stellarXdr_generated2.default.Signer({ key: key, weight: weight });
      }

      var setOptionsOp = new _stellarXdr_generated2.default.SetOptionsOp(attributes);

      var opAttributes = {};
      opAttributes.body = _stellarXdr_generated2.default.OperationBody.setOption(setOptionsOp);
      this.setSourceAccount(opAttributes, opts);

      return new _stellarXdr_generated2.default.Operation(opAttributes);
    }

    /**
     * Returns a XDR ManageOfferOp. A "manage offer" operation creates, updates, or
     * deletes an offer.
     * @param {object} opts
     * @param {Asset} opts.selling - What you're selling.
     * @param {Asset} opts.buying - What you're buying.
     * @param {string} opts.amount - The total amount you're selling. If 0, deletes the offer.
     * @param {number|string|BigNumber|Object} opts.price - The exchange rate ratio (selling / buying)
     * @param {number} opts.price.n - If `opts.price` is an object: the price numerator
     * @param {number} opts.price.d - If `opts.price` is an object: the price denominator
     * @param {number|string} [opts.offerId ]- If `0`, will create a new offer (default). Otherwise, edits an exisiting offer.
     * @param {string} [opts.source] - The source account (defaults to transaction source).
     * @throws {Error} Throws `Error` when the best rational approximation of `price` cannot be found.
     * @returns {xdr.ManageOfferOp}
     */

  }, {
    key: "manageOffer",
    value: function manageOffer(opts) {
      var attributes = {};
      attributes.selling = opts.selling.toXDRObject();
      attributes.buying = opts.buying.toXDRObject();
      if (!this.isValidAmount(opts.amount, true)) {
        throw new TypeError(Operation.constructAmountRequirementsError('amount'));
      }
      attributes.amount = this._toXDRAmount(opts.amount);
      if ((0, _isUndefined2.default)(opts.price)) {
        throw new TypeError('price argument is required');
      }
      attributes.price = this._toXDRPrice(opts.price);

      if (!(0, _isUndefined2.default)(opts.offerId)) {
        opts.offerId = opts.offerId.toString();
      } else {
        opts.offerId = '0';
      }
      attributes.offerId = _jsXdr.UnsignedHyper.fromString(opts.offerId);
      var manageOfferOp = new _stellarXdr_generated2.default.ManageOfferOp(attributes);

      var opAttributes = {};
      opAttributes.body = _stellarXdr_generated2.default.OperationBody.manageOffer(manageOfferOp);
      this.setSourceAccount(opAttributes, opts);

      return new _stellarXdr_generated2.default.Operation(opAttributes);
    }

    /**
     * Returns a XDR CreatePasiveOfferOp. A "create passive offer" operation creates an
     * offer that won't consume a counter offer that exactly matches this offer. This is
     * useful for offers just used as 1:1 exchanges for path payments. Use manage offer
     * to manage this offer after using this operation to create it.
     * @param {object} opts
     * @param {Asset} opts.selling - What you're selling.
     * @param {Asset} opts.buying - What you're buying.
     * @param {string} opts.amount - The total amount you're selling. If 0, deletes the offer.
     * @param {number|string|BigNumber|Object} opts.price - The exchange rate ratio (selling / buying)
     * @param {number} opts.price.n - If `opts.price` is an object: the price numerator
     * @param {number} opts.price.d - If `opts.price` is an object: the price denominator
     * @param {string} [opts.source] - The source account (defaults to transaction source).
     * @throws {Error} Throws `Error` when the best rational approximation of `price` cannot be found.
     * @returns {xdr.CreatePassiveOfferOp}
     */

  }, {
    key: "createPassiveOffer",
    value: function createPassiveOffer(opts) {
      var attributes = {};
      attributes.selling = opts.selling.toXDRObject();
      attributes.buying = opts.buying.toXDRObject();
      if (!this.isValidAmount(opts.amount)) {
        throw new TypeError(Operation.constructAmountRequirementsError('amount'));
      }
      attributes.amount = this._toXDRAmount(opts.amount);
      if ((0, _isUndefined2.default)(opts.price)) {
        throw new TypeError('price argument is required');
      }
      attributes.price = this._toXDRPrice(opts.price);
      var createPassiveOfferOp = new _stellarXdr_generated2.default.CreatePassiveOfferOp(attributes);

      var opAttributes = {};
      opAttributes.body = _stellarXdr_generated2.default.OperationBody.createPassiveOffer(createPassiveOfferOp);
      this.setSourceAccount(opAttributes, opts);

      return new _stellarXdr_generated2.default.Operation(opAttributes);
    }

    /**
     * Transfers native balance to destination account.
     * @param {object} opts
     * @param {string} opts.destination - Destination to merge the source account into.
     * @param {string} [opts.source] - The source account (defaults to transaction source).
     * @returns {xdr.AccountMergeOp}
     */

  }, {
    key: "accountMerge",
    value: function accountMerge(opts) {
      var opAttributes = {};
      if (!_strkey.StrKey.isValidEd25519PublicKey(opts.destination)) {
        throw new Error("destination is invalid");
      }
      opAttributes.body = _stellarXdr_generated2.default.OperationBody.accountMerge(_keypair.Keypair.fromPublicKey(opts.destination).xdrAccountId());
      this.setSourceAccount(opAttributes, opts);

      return new _stellarXdr_generated2.default.Operation(opAttributes);
    }

    /**
     * This operation generates the inflation.
     * @param {object} [opts]
     * @param {string} [opts.source] - The optional source account.
     * @returns {xdr.InflationOp}
     */

  }, {
    key: "inflation",
    value: function inflation() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var opAttributes = {};
      opAttributes.body = _stellarXdr_generated2.default.OperationBody.inflation();
      this.setSourceAccount(opAttributes, opts);
      return new _stellarXdr_generated2.default.Operation(opAttributes);
    }

    /**
     * This operation adds data entry to the ledger.
     * @param {object} opts
     * @param {string} opts.name - The name of the data entry.
     * @param {string|Buffer} opts.value - The value of the data entry.
     * @param {string} [opts.source] - The optional source account.
     * @returns {xdr.ManageDataOp}
     */

  }, {
    key: "manageData",
    value: function manageData(opts) {
      var attributes = {};

      if (!((0, _isString2.default)(opts.name) && opts.name.length <= 64)) {
        throw new Error("name must be a string, up to 64 characters");
      }
      attributes.dataName = opts.name;

      if (!(0, _isString2.default)(opts.value) && !Buffer.isBuffer(opts.value) && opts.value !== null) {
        throw new Error("value must be a string, Buffer or null");
      }

      if ((0, _isString2.default)(opts.value)) {
        attributes.dataValue = new Buffer(opts.value);
      } else {
        attributes.dataValue = opts.value;
      }

      if (attributes.dataValue !== null && attributes.dataValue.length > 64) {
        throw new Error("value cannot be longer that 64 bytes");
      }

      var manageDataOp = new _stellarXdr_generated2.default.ManageDataOp(attributes);

      var opAttributes = {};
      opAttributes.body = _stellarXdr_generated2.default.OperationBody.manageDatum(manageDataOp);
      this.setSourceAccount(opAttributes, opts);

      return new _stellarXdr_generated2.default.Operation(opAttributes);
    }
  }, {
    key: "setSourceAccount",
    value: function setSourceAccount(opAttributes, opts) {
      if (opts.source) {
        if (!_strkey.StrKey.isValidEd25519PublicKey(opts.source)) {
          throw new Error("Source address is invalid");
        }
        opAttributes.sourceAccount = _keypair.Keypair.fromPublicKey(opts.source).xdrAccountId();
      }
    }

    /**
     * Converts the XDR Operation object to the opts object used to create the XDR
     * operation.
     * @param {xdr.Operation} operation - An XDR Operation.
     * @return {Operation}
     */

  }, {
    key: "fromXDRObject",
    value: function fromXDRObject(operation) {
      function accountIdtoAddress(accountId) {
        return _strkey.StrKey.encodeEd25519PublicKey(accountId.ed25519());
      }

      var result = {};
      if (operation.sourceAccount()) {
        result.source = accountIdtoAddress(operation.sourceAccount());
      }

      var attrs = operation.body().value();
      switch (operation.body().switch().name) {
        case "createAccount":
          result.type = "createAccount";
          result.destination = accountIdtoAddress(attrs.destination());
          result.startingBalance = this._fromXDRAmount(attrs.startingBalance());
          break;
        case "payment":
          result.type = "payment";
          result.destination = accountIdtoAddress(attrs.destination());
          result.asset = _asset.Asset.fromOperation(attrs.asset());
          result.amount = this._fromXDRAmount(attrs.amount());
          break;
        case "pathPayment":
          result.type = "pathPayment";
          result.sendAsset = _asset.Asset.fromOperation(attrs.sendAsset());
          result.sendMax = this._fromXDRAmount(attrs.sendMax());
          result.destination = accountIdtoAddress(attrs.destination());
          result.destAsset = _asset.Asset.fromOperation(attrs.destAsset());
          result.destAmount = this._fromXDRAmount(attrs.destAmount());
          var path = attrs.path();
          result.path = [];
          for (var i in path) {
            result.path.push(_asset.Asset.fromOperation(path[i]));
          }
          break;
        case "changeTrust":
          result.type = "changeTrust";
          result.line = _asset.Asset.fromOperation(attrs.line());
          result.limit = this._fromXDRAmount(attrs.limit());
          break;
        case "allowTrust":
          result.type = "allowTrust";
          result.trustor = accountIdtoAddress(attrs.trustor());
          result.assetCode = attrs.asset().value().toString();
          result.assetCode = (0, _trimEnd2.default)(result.assetCode, "\0");
          result.authorize = attrs.authorize();
          break;
        case "setOption":
          result.type = "setOptions";
          if (attrs.inflationDest()) {
            result.inflationDest = accountIdtoAddress(attrs.inflationDest());
          }

          result.clearFlags = attrs.clearFlags();
          result.setFlags = attrs.setFlags();
          result.masterWeight = attrs.masterWeight();
          result.lowThreshold = attrs.lowThreshold();
          result.medThreshold = attrs.medThreshold();
          result.highThreshold = attrs.highThreshold();
          result.homeDomain = attrs.homeDomain();

          if (attrs.signer()) {
            var signer = {};
            var arm = attrs.signer().key().arm();
            if (arm == "ed25519") {
              signer.ed25519PublicKey = accountIdtoAddress(attrs.signer().key());
            } else if (arm == "preAuthTx") {
              signer.preAuthTx = attrs.signer().key().preAuthTx();
            } else if (arm == "hashX") {
              signer.sha256Hash = attrs.signer().key().hashX();
            }

            signer.weight = attrs.signer().weight();
            result.signer = signer;
          }
          break;
        case "manageOffer":
          result.type = "manageOffer";
          result.selling = _asset.Asset.fromOperation(attrs.selling());
          result.buying = _asset.Asset.fromOperation(attrs.buying());
          result.amount = this._fromXDRAmount(attrs.amount());
          result.price = this._fromXDRPrice(attrs.price());
          result.offerId = attrs.offerId().toString();
          break;
        case "createPassiveOffer":
          result.type = "createPassiveOffer";
          result.selling = _asset.Asset.fromOperation(attrs.selling());
          result.buying = _asset.Asset.fromOperation(attrs.buying());
          result.amount = this._fromXDRAmount(attrs.amount());
          result.price = this._fromXDRPrice(attrs.price());
          break;
        case "accountMerge":
          result.type = "accountMerge";
          result.destination = accountIdtoAddress(attrs);
          break;
        case "manageDatum":
          result.type = "manageData";
          result.name = attrs.dataName();
          result.value = attrs.dataValue();
          break;
        case "inflation":
          result.type = "inflation";
          break;
        default:
          throw new Error("Unknown operation");
      }
      return result;
    }
  }, {
    key: "isValidAmount",
    value: function isValidAmount(value) {
      var allowZero = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (!(0, _isString2.default)(value)) {
        return false;
      }

      var amount = void 0;
      try {
        amount = new _bignumber2.default(value);
      } catch (e) {
        return false;
      }

      // == 0
      if (!allowZero && amount.isZero()) {
        return false;
      }

      // < 0
      if (amount.isNegative()) {
        return false;
      }

      // > Max value
      if (amount.times(ONE).greaterThan(new _bignumber2.default(MAX_INT64).toString())) {
        return false;
      }

      // Decimal places (max 7)
      if (amount.decimalPlaces() > 7) {
        return false;
      }

      // Infinity
      if (!amount.isFinite()) {
        return false;
      }

      // NaN
      if (amount.isNaN()) {
        return false;
      }

      return true;
    }
  }, {
    key: "constructAmountRequirementsError",
    value: function constructAmountRequirementsError(arg) {
      return arg + " argument must be of type String, represent a positive number and have at most 7 digits after the decimal";
    }

    /**
     * Returns value converted to uint32 value or undefined.
     * If `value` is not `Number`, `String` or `Undefined` then throws an error.
     * Used in {@link Operation.setOptions}.
     * @private
     * @param {string} name Name of the property (used in error message only)
     * @param {*} value Value to check
     * @param {function(value, name)} isValidFunction Function to check other constraints (the argument will be a `Number`)
     * @returns {undefined|Number}
     * @private
     */

  }, {
    key: "_checkUnsignedIntValue",
    value: function _checkUnsignedIntValue(name, value) {
      var isValidFunction = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      if ((0, _isUndefined2.default)(value)) {
        return undefined;
      }

      if ((0, _isString2.default)(value)) {
        value = parseFloat(value);
      }

      if (!(0, _isNumber2.default)(value) || !(0, _isFinite2.default)(value) || value % 1 !== 0) {
        throw new Error(name + " value is invalid");
      }

      if (value < 0) {
        throw new Error(name + " value must be unsigned");
      }

      if (!isValidFunction || isValidFunction && isValidFunction(value, name)) {
        return value;
      }

      throw new Error(name + " value is invalid");
    }

    /**
     * @private
     */

  }, {
    key: "_toXDRAmount",
    value: function _toXDRAmount(value) {
      var amount = new _bignumber2.default(value).mul(ONE);
      return _jsXdr.Hyper.fromString(amount.toString());
    }

    /**
     * @private
     */

  }, {
    key: "_fromXDRAmount",
    value: function _fromXDRAmount(value) {
      return new _bignumber2.default(value).div(ONE).toString();
    }

    /**
     * @private
     */

  }, {
    key: "_fromXDRPrice",
    value: function _fromXDRPrice(price) {
      var n = new _bignumber2.default(price.n());
      return n.div(new _bignumber2.default(price.d())).toString();
    }

    /**
     * @private
     */

  }, {
    key: "_toXDRPrice",
    value: function _toXDRPrice(price) {
      var xdrObject = void 0;
      if (price.n && price.d) {
        xdrObject = new _stellarXdr_generated2.default.Price(price);
      } else {
        price = new _bignumber2.default(price);
        var approx = (0, _continued_fraction.best_r)(price);
        xdrObject = new _stellarXdr_generated2.default.Price({
          n: parseInt(approx[0]),
          d: parseInt(approx[1])
        });
      }

      if (xdrObject.n() < 0 || xdrObject.d() < 0) {
        throw new Error('price must be positive');
      }

      return xdrObject;
    }
  }]);

  return Operation;
}();
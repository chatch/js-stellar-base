"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TransactionBuilder = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stellarXdr_generated = require("./generated/stellar-xdr_generated");

var _stellarXdr_generated2 = _interopRequireDefault(_stellarXdr_generated);

var _jsXdr = require("js-xdr");

var _hashing = require("./hashing");

var _keypair = require("./keypair");

var _account = require("./account");

var _operation = require("./operation");

var _transaction = require("./transaction");

var _memo = require("./memo");

var _bignumber = require("bignumber.js");

var _bignumber2 = _interopRequireDefault(_bignumber);

var _clone = require("lodash/clone");

var _clone2 = _interopRequireDefault(_clone);

var _map = require("lodash/map");

var _map2 = _interopRequireDefault(_map);

var _isUndefined = require("lodash/isUndefined");

var _isUndefined2 = _interopRequireDefault(_isUndefined);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BASE_FEE = 100; // Stroops
var MIN_LEDGER = 0;
var MAX_LEDGER = 0xFFFFFFFF; // max uint32

var TransactionBuilder = exports.TransactionBuilder = function () {
  /**
   * <p>Transaction builder helps constructs a new `{@link Transaction}` using the given {@link Account}
   * as the transaction's "source account". The transaction will use the current sequence
   * number of the given account as its sequence number and increment the given account's
   * sequence number by one. The given source account must include a private key for signing
   * the transaction or an error will be thrown.</p>
   *
   * <p>Operations can be added to the transaction via their corresponding builder methods, and
   * each returns the TransactionBuilder object so they can be chained together. After adding
   * the desired operations, call the `build()` method on the `TransactionBuilder` to return a fully
   * constructed `{@link Transaction}` that can be signed. The returned transaction will contain the
   * sequence number of the source account and include the signature from the source account.</p>
   *
   * <p>The following code example creates a new transaction with {@link Operation.createAccount} and
   * {@link Operation.payment} operations.
   * The Transaction's source account first funds `destinationA`, then sends
   * a payment to `destinationB`. The built transaction is then signed by `sourceKeypair`.</p>
   *
   * ```
   * var transaction = new TransactionBuilder(source)
   *  .addOperation(Operation.createAccount({
          destination: destinationA,
          startingBalance: "20"
      }) // <- funds and creates destinationA
      .addOperation(Operation.payment({
          destination: destinationB,
          amount: "100"
          asset: Asset.native()
      }) // <- sends 100 XLM to destinationB
   *   .build();
   *
   * transaction.sign(sourceKeypair);
   * ```
   * @constructor
   * @param {Account} sourceAccount - The source account for this transaction.
   * @param {object} [opts]
   * @param {number} [opts.fee] - The max fee willing to pay per operation in this transaction (**in stroops**).
   * @param {object} [opts.timebounds] - The timebounds for the validity of this transaction.
   * @param {number|string} [opts.timebounds.minTime] - 64 bit unix timestamp
   * @param {number|string} [opts.timebounds.maxTime] - 64 bit unix timestamp
   * @param {Memo} [opts.memo] - The memo for the transaction
   */
  function TransactionBuilder(sourceAccount) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, TransactionBuilder);

    if (!sourceAccount) {
      throw new Error("must specify source account for the transaction");
    }
    this.source = sourceAccount;
    this.operations = [];
    this.baseFee = (0, _isUndefined2.default)(opts.fee) ? BASE_FEE : opts.fee;
    this.timebounds = (0, _clone2.default)(opts.timebounds);
    this.memo = opts.memo || _memo.Memo.none();

    // the signed base64 form of the transaction to be sent to Horizon
    this.blob = null;
  }

  /**
   * Adds an operation to the transaction.
   * @param {xdr.Operation} operation The xdr operation object, use {@link Operation} static methods.
   * @returns {TransactionBuilder}
   */


  _createClass(TransactionBuilder, [{
    key: "addOperation",
    value: function addOperation(operation) {
      this.operations.push(operation);
      return this;
    }

    /**
     * Adds a memo to the transaction.
     * @param {Memo} memo {@link Memo} object
     * @returns {TransactionBuilder}
     */

  }, {
    key: "addMemo",
    value: function addMemo(memo) {
      this.memo = memo;
      return this;
    }

    /**
     * This will build the transaction.
     * It will also increment the source account's sequence number by 1.
     * @returns {Transaction} This method will return the built {@link Transaction}.
     */

  }, {
    key: "build",
    value: function build() {
      var sequenceNumber = new _bignumber2.default(this.source.sequenceNumber()).add(1);

      var attrs = {
        sourceAccount: _keypair.Keypair.fromPublicKey(this.source.accountId()).xdrAccountId(),
        fee: this.baseFee * this.operations.length,
        seqNum: _stellarXdr_generated2.default.SequenceNumber.fromString(sequenceNumber.toString()),
        memo: this.memo ? this.memo.toXDRObject() : null,
        ext: new _stellarXdr_generated2.default.TransactionExt(0)
      };

      if (this.timebounds) {
        this.timebounds.minTime = _jsXdr.UnsignedHyper.fromString(this.timebounds.minTime.toString());
        this.timebounds.maxTime = _jsXdr.UnsignedHyper.fromString(this.timebounds.maxTime.toString());
        attrs.timeBounds = new _stellarXdr_generated2.default.TimeBounds(this.timebounds);
      }

      var xtx = new _stellarXdr_generated2.default.Transaction(attrs);
      xtx.operations(this.operations);

      var xenv = new _stellarXdr_generated2.default.TransactionEnvelope({ tx: xtx });
      var tx = new _transaction.Transaction(xenv);

      this.source.incrementSequenceNumber();

      return tx;
    }
  }]);

  return TransactionBuilder;
}();
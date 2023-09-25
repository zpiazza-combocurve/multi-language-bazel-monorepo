"use strict";

var util = require("util");
var bcrypt = require("bcryptjs");
var TokenStore = require("passwordless-tokenstore");
var MongoClient = require("mongodb").MongoClient;

/**
 * Constructor of MongoStore
 * @param {mongoose.Connection} collection Underlying MongoDB collection
 * https://github.com/Automattic/mongoose#driver-access
 * @constructor
 */
function MongoStore(collection) {
  if (arguments.length === 0) {
    throw new Error("A valid mongodb collection has to be provided");
  }

  TokenStore.call(this);

  this._collection = collection;
  this._initialized = false;
}

util.inherits(MongoStore, TokenStore);

/**
 * Checks if the provided token / user id combination exists and is
 * valid in terms of time-to-live. If yes, the method provides the
 * the stored referrer URL if any.
 * @param  {String}   token to be authenticated
 * @param  {String}   uid Unique identifier of an user
 * @param  {Function} callback in the format (error, valid, referrer).
 * In case of error, error will provide details, valid will be false and
 * referrer will be null. If the token / uid combination was not found
 * found, valid will be false and all else null. Otherwise, valid will
 * be true, referrer will (if provided when the token was stored) the
 * original URL requested and error will be null.
 */
MongoStore.prototype.authenticate = function (token, uid, callback) {
  if (!token || !uid || !callback) {
    throw new Error("TokenStore:authenticate called with invalid parameters");
  }

  this._get_collection(function (collection) {
    collection.findOne(
      { uid: uid, ttl: { $gt: new Date() } },
      function (err, item) {
        if (err) {
          callback(err, false, null);
        } else if (item) {
          bcrypt.compare(token, item.hashedToken, function (err, res) {
            if (err) {
              callback(err, false, null);
            } else if (res) {
              callback(null, true, item.originUrl || "");
            } else {
              callback(null, false, null);
            }
          });
        } else {
          callback(null, false, null);
        }
      }
    );
  });
};

/**
 * Stores a new token / user ID combination or updates the token of an
 * existing user ID if that ID already exists. Hence, a user can only
 * have one valid token at a time
 * @param  {String}   token Token that allows authentication of _uid_
 * @param  {String}   uid Unique identifier of an user
 * @param  {Number}   msToLive Validity of the token in ms
 * @param  {String}   originUrl Originally requested URL or null
 * @param  {Function} callback Called with callback(error) in case of an
 * error or as callback() if the token was successully stored / updated
 */
MongoStore.prototype.storeOrUpdate = function (
  token,
  uid,
  msToLive,
  originUrl,
  callback
) {
  if (!token || !uid || !msToLive || !callback) {
    throw new Error("TokenStore:storeOrUpdate called with invalid parameters");
  }
  this._get_collection(function (collection) {
    bcrypt.hash(token, 10, function (err, hashedToken) {
      if (err) {
        return callback(err);
      }

      var newRecord = {
        hashedToken: hashedToken,
        uid: uid,
        ttl: new Date(Date.now() + msToLive),
        originUrl: originUrl,
      };

      // Insert or update
      collection.updateOne(
        { uid: uid },
        { $set: newRecord },
        { w: 1, upsert: true },
        function (err, result) {
          if (err) {
            callback(err);
          } else {
            callback();
          }
        }
      );
    });
  });
};

/**
 * Invalidates and removes a user and the linked token
 * @param  {String}   user ID
 * @param  {Function} callback called with callback(error) in case of an
 * error or as callback() if the uid was successully invalidated
 */
MongoStore.prototype.invalidateUser = function (uid, callback) {
  if (!uid || !callback) {
    throw new Error("TokenStore:invalidateUser called with invalid parameters");
  }
  this._get_collection(function (collection) {
    collection.deleteMany({ uid: uid }, { w: 1 }, function (err, result) {
      if (err) {
        callback(err);
      } else {
        callback();
      }
    });
  });
};

/**
 * Removes and invalidates all token
 * @param  {Function} callback Called with callback(error) in case of an
 * error or as callback() if the token was successully stored / updated
 */
MongoStore.prototype.clear = function (callback) {
  if (!callback) {
    throw new Error("TokenStore:clear called with invalid parameters");
  }
  this._get_collection(function (collection) {
    collection.deleteMany({}, { w: 1 }, function (err, result) {
      if (err) {
        callback(err);
      } else {
        callback();
      }
    });
  });
};

/**
 * Number of tokens stored (no matter the validity)
 * @param  {Function} callback Called with callback(null, count) in case
 * of success or with callback(error) in case of an error
 */
MongoStore.prototype.length = function (callback) {
  this._get_collection(function (collection) {
    collection.countDocuments(callback);
  });
};

/**
 * Private method to connect to the right collection
 * @private
 */
MongoStore.prototype._get_collection = function (callback) {
  var self = this;
  if (self._collection) {
    if (!self._initialized) {
      self._set_index(self._collection, callback);
      self._initialized = true;
    } else {
      callback(self._collection);
    }
  } else {
    throw new Error("Error, no MongoDB collection");
  }
};

/**
 * Private method build up the indexes of the collection if needed
 * @private
 */
MongoStore.prototype._set_index = function (collection, callback) {
  var self = this;
  collection.createIndex({ uid: 1 }, { unique: true }, function (err, index) {
    if (err) {
      throw new Error("Error creating index on uid: " + err);
    }
    collection.createIndex(
      { ttl: 1 },
      { expireAfterSeconds: 0 },
      function (err, index) {
        if (err) {
          throw new Error("Error creating ttl index on ttl: " + err);
        }
        self._collection = collection;
        callback(collection);
      }
    );
  });
};

module.exports = MongoStore;

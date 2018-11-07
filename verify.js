const sodium = require('sodium-native');

module.exports = {
    verify: function(signature, message, publicKey){
      var signature = Buffer.from(signature, 'hex');
      var message = Buffer.from(message, 'hex');
      var publicKey = Buffer.from(publicKey, 'hex');
      return sodium.crypto_sign_verify_detached(signature, message, publicKey);
    }
}

const sodium = require('sodium-native');

module.exports = {
    sign : function (message, secretKey){
        var signature = Buffer.alloc(sodium.crypto_sign_BYTES);
        var message = Buffer.from(message, 'hex');
        var secretKey = Buffer.from(secretKey, 'hex');

        sodium.crypto_sign_detached(signature, message, secretKey);
        return signature;
    }
}

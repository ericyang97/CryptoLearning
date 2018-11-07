// bank.js
const jsonStream = require('duplex-json-stream');
const net = require('net');
const fs = require('fs');
const sodium = require('sodium-native');
var web3 = require('web3');

var sign = require('./sign.js');
var verify = require('./verify.js');

//Load transactions from local json file
var log = require('./transactions.json');

//Check if there're keys already existing in the hard disk, if not then generate a key pair
var keyPair = require('./keys.json');
if (Object.keys(keyPair).length > 0){
  var secretKey = keyPair.secretKey;
  var publicKey = keyPair.publicKey;
}
else{
  var publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES);
  var secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES);
  sodium.crypto_sign_keypair(publicKey, secretKey);
  var keys = {
              "secretKey" : secretKey.toString('hex'),
              "publicKey" : publicKey.toString('hex')
            };
  fs.writeFile('keys.json', JSON.stringify(keys, null, 1), (error) => {});
}

// One edge-case with referring to the previous hash is that you need a "genesis" hash for the first entry in the log
var genesisHash = Buffer.alloc(32).toString('hex')

//Use the previous hash and current entry together to generate a new hash for the entry
function hash (prevHash, cur){
  var input  = Buffer.from(prevHash + JSON.stringify(cur));
  var output = Buffer.alloc(sodium.crypto_generichash_BYTES);
  sodium.crypto_generichash(output, input);
  return output;
}

function appendToTransactionLog (entry) {
  var prevHash = log.length ? log[log.length - 1].hash : genesisHash;
  var currentHash = hash(prevHash, entry).toString('hex');
  var signature = sign.sign(currentHash, secretKey).toString('hex');
  log.push({
    value: entry,
    hash: currentHash,
    signature: signature
  });
}

//Loop through the transaction log, and calculate the last hash based on the previous hashes and values
function hashChainReducer(prevHash, entry){
  var output = hash(prevHash, entry.value);
  return output.toString('hex');
}

var reducer = function (balance, entry) {return balance + entry.value.amount};
var _totalBalance = log.reduce(reducer,0);

//Verify if the new hash value(calculated using all values in the current log) is same as the last hash in hash chain, also validate their signature using verify function
function validateLog(log){
  if(log.length == 0){ //if log is empty, returns true
    return true;
  }
  else{
    for(let [index, element] of log.entries()){
      if(!verify.verify(element.signature, element.hash, publicKey)){
        console.log("Signature verification fails at the No." + (index+1)+ " transaction." );
        return false;
        }
    }

    var newHash = log.reduce(hashChainReducer, genesisHash);

    if(!(newHash == log[log.length - 1].hash)){
      console.log("Signature verification is successful, but hash verification fails.");
      return false;
    }
    return true;
  }
}


if(validateLog(log)){
var server = net.createServer(function(socket) {
  socket = jsonStream(socket);

  socket.on('data', function(msg) {
    console.log('Bank received:', msg);

    switch (msg.cmd) {
      case 'balance':
        socket.write({cmd: 'balance', balance: _totalBalance});
        break;

      //Push the transaction into log
      case 'deposit':
        _totalBalance += msg.amount;
        appendToTransactionLog(msg);
        fs.writeFile('transactions.json', JSON.stringify(log, null, 1), (error) => {});
        socket.write({cmd: 'balance', balance: _totalBalance});
        break;

      //Check if there's sufficient balance to withdraw, if so, push the transaction into log
      case 'withdraw':
        if(log.reduce(reducer,0) >= msg.amount){
          _totalBalance -= msg.amount;
          var entry = {cmd: 'withdraw', amount: -msg.amount};
          appendToTransactionLog(entry);
          fs.writeFile('transactions.json', JSON.stringify(log, null, 1), (error) => {});
          socket.write({cmd: 'balance', balance: _totalBalance});
        }else{
          socket.write('Not enough fund in the account');
        }
        break;

      //Base case
      default:
        break;
    }
  })
 })
 //console.log("success");
 server.listen(3876);
}
else {
  console.log('!!!!!!!!!!!! Transactions has been tampered !!!!!!!!!!!!');
}

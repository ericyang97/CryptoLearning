// bank.js
const jsonStream = require('duplex-json-stream')
const net = require('net')
const fs = require('fs')
const sodium = require('sodium-native')


//Load transactions from local json file
var log = require('./transactions.json')

// One edge-case with referring to the previous hash is that you need a "genesis" hash for the first entry in the log
var genesisHash = Buffer.alloc(32).toString('hex')

//Use the previous hash and current entry together to generate a new hash for the entry
function hash (prevHash, cur){
  var input  = Buffer.from(prevHash + JSON.stringify(cur))
  var output = Buffer.alloc(sodium.crypto_generichash_BYTES)
  sodium.crypto_generichash(output, input)
  return output
}

function appendToTransactionLog (entry) {
  var prevHash = log.length ? log[log.length - 1].hash : genesisHash
  var currentHash = hash(prevHash, entry)
  log.push({
    value: entry,
    hash: currentHash.toString('hex')
  })
}

function hashChainReducer(prevHash, entry){
  var output = hash(prevHash, entry.value)
  return output.toString('hex')
}

//Verify if the new hash value(calculated using all values in the current log) is same as the last hash in hash chain
function verify(log){
  if(log.length > 0){
    var newHash = log.reduce(hashChainReducer, genesisHash)
    return newHash == log[log.length - 1].hash
  }
  else{
    return true
  }
}

var reducer = function (balance, entry) {return balance + entry.value.amount}
var totalBalance = log.reduce(reducer,0)

if(verify(log)){
var server = net.createServer(function(socket) {
  socket = jsonStream(socket)

  socket.on('data', function(msg) {
    console.log('Bank received:', msg)
    // socket.write can be used to send a reply
    //socket.write('a')
    var isSufficient = true
    switch (msg.cmd) {
      case 'balance':
        //socket.end({cmd: 'balance', balance: log.reduce(reducer, 0)});
        break

      //Push the transaction into log
      case 'deposit':
        totalBalance += msg.amount
        appendToTransactionLog(msg)
        break

      //Check if there's sufficient balance to withdraw, if so, push the transaction into log
      case 'withdraw':
        if(log.reduce(reducer,0) >= msg.amount){
          totalBalance -= msg.amount
          var entry = {cmd: 'withdraw', amount: -msg.amount};
          appendToTransactionLog(entry)
        }else{
          isSufficient = false
        }
        break;

      //Base case
      default:
        break
    }
    if (isSufficient) {
      fs.writeFile('transactions.json', JSON.stringify(log, null, 1), (error) => {})
      socket.write({cmd: 'balance', balance: totalBalance})
    }
    else {
      socket.write('Not enough fund in the account')
    }
  })
 })
 //console.log("success");
 server.listen(3876)
}
else {
  console.log('!!!! Transactions has been tampered !!!!')
}

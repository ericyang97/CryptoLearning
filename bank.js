// bank.js
var jsonStream = require('duplex-json-stream')
var net = require('net')
const fs = require('fs')

//Load transactions from local json file
var log = require('./transactions.json')
//console.log(typeof(log))
//console.log(log)
//var log = []

var reducer = function (balance, entry) {return balance + entry.amount}
var currentBalance = log.reduce(reducer,0)


var server = net.createServer(function(socket) {
  socket = jsonStream(socket)

  socket.on('data', function(msg) {
    console.log('Bank received:', msg)
    // socket.write can be used to send a reply
    //socket.write('a')
    var isSufficient = true
    switch (msg.cmd) {
      //Reply with the current balance
      case 'balance':
        //socket.end({cmd: 'balance', balance: log.reduce(reducer, 0)});
        break

      //Push the transaction into log, and reply with the current balance
      case 'deposit':
        log.push(msg);
        //socket.end({cmd: 'balance', balance: log.reduce(reducer, 0)});
        break

      case 'withdraw':
        if(log.reduce(reducer,0) >= msg.amount){
          var entry = {cmd: 'withdraw', amount: -msg.amount};
          log.push(entry);
          //socket.end({cmd: 'error', balance: 'Not enough amount in the account'})
        }else{
          isSufficient = false
        }

        break

      //Base case
      default:
        break
    }
    if (isSufficient) {
      fs.writeFile('transactions.json', JSON.stringify(log, null, 1), (error) => { /* handle error */ })
      socket.end({cmd: 'balance', balance: log.reduce(reducer,0)})
    }
    else {
      socket.write('Not enough fund in the account')
    }
  })

})

//console.log("success");
server.listen(3876)

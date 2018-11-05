// bank.js
var jsonStream = require('duplex-json-stream')
var net = require('net')

//Intialize an empty transaction log
var log = [];
var reducer = function (balance, entry) {return balance + entry.amount}

var server = net.createServer(function(socket) {
  socket = jsonStream(socket)

  socket.on('data', function(msg) {
    console.log('Bank received:', msg)
    // socket.write can be used to send a reply
    //socket.write('a')

    switch (msg.cmd) {
      //Reply with the current balance
      case 'balance':
        socket.end({cmd: 'balance', balance: log.reduce(reducer, 0)});
        break

      //Push the transaction into log, and reply with the current balance
      case 'deposit':
        log.push(msg);
        socket.end({cmd: 'balance', balance: log.reduce(reducer, 0)});
        break

      case 'withdraw':
        if(log.reduce(reducer,0) - msg.amount < 0){
          socket.end({cmd: 'error', balance: 'Not enough amount in the account'})
        }else {
          var entry = {cmd: 'withdraw', amount: -msg.amount};
          log.push(entry);
          socket.end({cmd: 'balance', balance: log.reduce(reducer, 0)});
        }
        break

      //Base case
      default:
        socket.end({cmd: 'error', msg: 'Unknown command'})
        break
    }
  })

})

//console.log("success");
server.listen(3876)

// bank.js
var jsonStream = require('duplex-json-stream')
var net = require('net')

var server = net.createServer(function(socket) {
  socket = jsonStream(socket)

  socket.on('data', function(msg) {
    console.log('Bank received:', msg)
    // socket.write can be used to send a reply
    //socket.write('a')
    switch (command) {
    case 'balance':
      console.log()
      break

    case 'deposit':
      // ...
      break

    default:
      // Unknown command
      break
  }

    socket.write({cmd: 'balance', balance: 0})
  })

})

console.log("success");
server.listen(3876)

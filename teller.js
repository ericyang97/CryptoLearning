// teller.js
var jsonStream = require('duplex-json-stream')
var net = require('net')

var client = jsonStream(net.connect(3876))

// Catch the text from command line and discard the first two elements(because first two are execPath and Javascript file path.)
var argv = process.argv.slice(2)

var command = argv[0]

client.on('data', function (msg) {
  console.log('Teller received: ', msg)
})

switch (command) {
  case 'deposit':
    var amount = parseFloat(argv[1])
    client.end({cmd: 'deposit', amount: amount})
    break

  case 'balance':
    client.end({cmd: 'balance'})
    break

  case 'withdraw':
    var amount = parseFloat(argv[1])
    client.end({cmd: 'withdraw', amount: amount})
    break

  case 'help':
  default:
    console.log('node teller.js [CMD]')
}
// client.end can be used to send a request and close the socket
//client.end({cmd : 'balance'});

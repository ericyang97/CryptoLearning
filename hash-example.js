var sodium = require('sodium-native')

const string = Buffer.from('Hello, World!')
console.log('String: ')
console.log(string.toString('hex'))

var hash = Buffer.alloc(sodium.crypto_generichash_BYTES)
console.log('HASH BYTES: ')
console.log(hash.toString('hex'))

sodium.crypto_generichash(hash, string)
//Print the new hashed ouput
console.log("New hashed output is: ")
console.log(hash.toString('hex'))

correctOutput = Buffer.from('511bc81dde11180838c562c82bb35f3223f46061ebde4a955c27b3f489cf1e03', 'hex')

//Check if our hash is identical with the correct answer
console.log(correctOutput.equals(hash))

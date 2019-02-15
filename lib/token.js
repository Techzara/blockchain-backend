const Web3 = require('web3')
const path = require('path')
const cjson = require('cjson')
const TX = require('ethereumjs-tx')

// soloy ireto
const provider = 'HTTP://127.0.0.1:8545'
const contractAddress = '0x81119ad5ddf8447bcef374231c3fb83683e9ac44'
const privateKey = new Buffer('6b48ec3f94c6eeaa91cf569bceb0379a1817a52cea089d699ffac9e2054d3620', 'hex')
const defaultAccount = '0x49124BecC5Ab97a2e3001c2e49518DAE97E10Fec'
const etherscanLink = 'https://rinkeby.etherscan.io/tx/'


const web3 = new Web3(provider)


var contract = null;

function convertWeiToEth( stringValue ) {
  if ( typeof stringValue != 'string' ) {
    stringValue = String( stringValue );
  }
  return web3.utils.fromWei( stringValue, "ether" );
}

function getContract() {
  if (contract === null) {
    var abi = cjson.load(path.resolve(__dirname, '../ABI/abi.json'));
    var c = new web3.eth.Contract(abi,contractAddress)
    contract = c.clone();
  }
  console.log('Contract Initiated successfully!')
  return contract;
}

async function sendToken(req, res) {
  var address = req.body.address
  var tokens = Number(req.body.tokens)

  if (address && tokens) {
    const rawTrans = getContract().methods.send(address, tokens)
    return res.send(await sendSignTransaction(rawTrans))
  } else {
    res.send({
      'message':'Wallet address or no. of tokens is missing.'
    })
  }

}

async function mintToken(req, res) {
  var address = req.body.address
  var tokens = Number(req.body.tokens)

  if (address && tokens) {
    const rawTrans = getContract().methods.mint(address, tokens)
    return res.send(await sendSignTransaction(rawTrans))
  } else {
    res.send({
      'message':'Wallet address or no. of tokens is missing.'
    })
  }
}

async function getBalance(req, res) {
  console.log(req.query)
  var address = req.query.address
  if (address) {
    var ethBalance = convertWeiToEth( await web3.eth.getBalance(address)) || '0'

    var tokenBalance = await getContract().methods.balances(address).call() || '0'

    return res.send({
      'EtherBalance': ethBalance,
      'TokenBalance': tokenBalance
    })
  }
}

async function sendSignTransaction(rawTrans) {
  // Initiate values required by the dataTrans
  if (rawTrans) {
    var txCount = await web3.eth.getTransactionCount(defaultAccount)
    var abiTrans = rawTrans.encodeABI()

    var gas = await rawTrans.estimateGas()
    var gasPrice = await web3.eth.getGasPrice()
    gasPrice = Number(gasPrice)
    gasPrice = gasPrice * 2
    var gasLimit = gas * 4

    var dataTrans = {
      nonce: web3.utils.toHex(txCount),
      gasLimit: web3.utils.toHex(gasLimit),
      gasPrice: web3.utils.toHex(gasPrice),
      to: contractAddress,
      data: abiTrans
    }

    var tx = new TX(dataTrans)
    tx.sign(privateKey)

    return await sendSigned(tx)
  } else {
    throw new console.error('Encoded raw transaction was not given.');
  }

}

function sendSigned(tx) {
  return new Promise(function(resolve,reject){
    web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'))
    .once('transactionHash', function(hash){
      var result = {
        'status':'sent',
        'url': etherscanLink + hash,
        'message':'click the given url to verify status of transaction'
      }

      resolve(result)
    })
    .then(out => {console.log(out)})
    .catch(err => {
      reject(err)
    })
  })
}

module.exports = {
  send: sendToken,
  mint: mintToken,
  balance: getBalance
}
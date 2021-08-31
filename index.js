
import {classifyTransaction,initCoinList,classifyandParseTransaction,classifyTransactionByTxHash,classifyAndParseTransactionByTxHash,parseLiquidationsAnchorApi} from './parser/index.js'
import pkg from 'sequelize';
import express from 'express';
import pkgfs from 'fs';
import { request, gql } from 'graphql-request'
const { fs} = pkgfs
const { Sequelize, Model, DataTypes,  QueryTypes } = pkg;
const app = new express;

const addressParseQueue = []
var parserThreadCount = 0 
/*const sequelize = new Sequelize('sqlite:database.db', {
  
  // disable logging; default: console.log
  logging: false

});

*/
const sequelize = new Sequelize('postgres://postgres:terraluna@localhost:5432/trackterra', {
  
  // disable logging; default: console.log
  logging: false

});
import { createRequire } from "module";
const require = createRequire(import.meta.url);

class transactionData extends Model {}
transactionData.init({
wallet_address: DataTypes.STRING,
transaction_timestamp:DataTypes.DATE,
transaction_timestamp_string:DataTypes.STRING,
transaction_from: DataTypes.STRING,
transaction_to: DataTypes.STRING,
memo: DataTypes.STRING,
amount_received: DataTypes.STRING,
amount_sent: DataTypes.STRING,
contract_address: DataTypes.STRING,
sent_currency:DataTypes.STRING,
received_currency: DataTypes.STRING,
net_worth_amount:  DataTypes.STRING,
net_worth_currency: DataTypes.STRING,
fee_amount:  DataTypes.STRING,
fee_currency: DataTypes.STRING,
token_sent_address:DataTypes.STRING,
token_received_address:DataTypes.STRING,
transaction_type:DataTypes.STRING,
koinly_label:DataTypes.STRING,
friendly_description:DataTypes.STRING,
txhash:DataTypes.STRING,
block_height:DataTypes.BIGINT
}, { sequelize, modelName: 'transactionsdata' });
await transactionData.sync();


class koinlyTokenNameLookup extends Model {}

koinlyTokenNameLookup.init({
token_name: DataTypes.STRING,
koinly_token_name:DataTypes.STRING
}, { sequelize, modelName: 'transactionsdata' });

await koinlyTokenNameLookup.sync();
//TODO list the rest of terra stable coins
const nativeTokensList =   {
  "uluna" : "LUNA", 
  "uusd" : "UST", 
  "ukrw": "KRT", 
  "usdr":"SDT",
  "umnt":"MNT"
}

var coinLists = {}
await initTokenLists()


console.log(await parse_anchor_liquidations("terra16nrajtdqzqp42r9ue4706q0390ncr39qj7fank"))

//console.log (await match_missing_transactions(walletAddress))
/*
Begin Web APP

*/

app.get('/parseWallet', async function (req, res) {
  var walletAddress = req.query.address
  res.set("Access-Control-Allow-Origin", "*")

  if (walletAddress.match(/^[0-9a-zA-Z]+$/)){

    if (addressParseQueue.includes (walletAddress)){
    
      res.end("processing")
    }else{
      parse_wallet(walletAddress) //async
      addressParseQueue.push(walletAddress)
      
      res.end("processing")
    }

  }else{
    res.end("invalid address")
  }


})

app.get('/parseStatus', async function (req, res) {
  var walletAddress = req.query.address

  res.set("Access-Control-Allow-Origin", "*")
  if (addressParseQueue.includes (walletAddress)){
   
    res.end("processing")
  }else{
    res.end("ready")
  }
})

//will parse missing tranactions track terra vs fcd
app.get('/validateWallet', async function (req, res) {
  var walletAddress = req.query.address

  res.set("Access-Control-Allow-Origin", "*")
var response = await validate_wallet(walletAddress)
    res.end(JSON.stringify(response))
  
})


app.use('/', express.static('html'))


app.get('/getTaxReport', async function (req, res) {
  
  var walletAddress = req.query.address;
  var returnDatas = await return_tax_report_data(walletAddress)
  
  res.set("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type","application/json")
  res.status(201).json(returnDatas["data"])

})
app.get('/getAllDataReport', async function (req, res) {
  
  var walletAddress = req.query.address;
  var returnDatas = await return_all_report_data(walletAddress)
  
  res.set("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type","application/json")
  res.status(201).json(returnDatas["data"])

})
app.get('/countTxs', async function (req, res) {
  var walletAddress = req.query.address
  res.set("Access-Control-Allow-Origin", "*")
  res.end( await return_transaction_count(walletAddress));
  
})

var server = app.listen(8081, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Track Terra listening at http://%s:%s", host, port)
})


/*
End Web APP

*/


async function return_transaction_count(walletAddress){
 
  var returnDatas = []
  returnDatas["txs"] = []
  var walletDatas = await transactionData.findAll({
  where: {
      wallet_address: walletAddress
    },
    order: [
      // sort by blockheight
      ['block_height', 'ASC'],
    ]
  });

  
return walletDatas["count"]
}
 async function return_data(walletAddress){
 
  var returnDatas = []
  returnDatas["txs"] = []
  var walletDatas = await transactionData.findAll({
  where: {
      wallet_address: walletAddress
    },
    order: [
      // sort by blockheight
      ['block_height', 'ASC'],
    ]
  });

  var logLen = walletDatas.length
  
  returnDatas["count"] = logLen
  for (let li = 0; li < logLen; li = li + 1) {
    returnDatas["txs"].push (walletDatas [li]["dataValues"])
  }
return returnDatas
}
async function return_tax_report_data(walletAddress){
 
  var returnDatas = []
  returnDatas["data"] = []
  var walletDatas = await transactionData.findAll({
    attributes: ['transaction_timestamp_string', 'amount_sent', 'sent_currency', 'amount_received', 'received_currency', 'fee_amount', 'fee_currency','net_worth_amount', 'net_worth_currency', 'koinly_label', 'friendly_description', 'txhash'],
  where: {
      wallet_address: walletAddress
    },
    order: [
      // sort by blockheight
      ['block_height', 'ASC'],
    ]
  });

  var logLen = walletDatas.length
  
  returnDatas["count"] = logLen
  for (let li = 0; li < logLen; li = li + 1) {
    returnDatas["data"].push (walletDatas [li]["dataValues"])
  }
return returnDatas
}


async function return_all_report_data(walletAddress){
 
  var returnDatas = []
  returnDatas["data"] = []
  var walletDatas = await transactionData.findAll({
    attributes: ['transaction_timestamp_string', 'amount_sent', 'sent_currency','token_sent_address', 'amount_received', 'received_currency','token_received_address', 'fee_amount', 'fee_currency','net_worth_amount', 'net_worth_currency','contract_address',  'memo', 'transaction_type', 'friendly_description', 'txhash','block_height'],
  where: {
      wallet_address: walletAddress
    },
    order: [
      // sort by blockheight
      ['block_height', 'ASC'],
    ]
  });

  var logLen = walletDatas.length
  
  returnDatas["count"] = logLen
  for (let li = 0; li < logLen; li = li + 1) {
    returnDatas["data"].push (walletDatas [li]["dataValues"])
  }
return returnDatas
}


async function validate_wallet(walletAddress){
  const phin = require("phin");
  //https://fcd.terra.dev/v1/txs?account=terra1m3jg6rdylqnpwtuv6hs034n662w57qyzen6t6s&limit=500&chainId=columbus-4

  var query_url = 'https://fcd.terra.dev/v1/txs?account='+walletAddress+'&chainId=columbus-4&limit=500'
  var txhash
  var txType 
  var returnData = await phin(query_url)
  var returnDatas = []
  returnData = JSON.parse(returnData.body)

  while (exists(returnData)){

      for (const txData of returnData["txs"]) {  
        txhash = txData["txhash"]
        if (await isTxHashUnique (txhash,walletAddress) == true){
          txType = await (classifyTransaction(txData))
            if (txType != "govVote"){ 
            returnDatas.push(txhash)
            }
          }
        }

        if ((exists (returnData["next"]) == false)){
          
          //breaks main loop
          break
        }

      var query_url = 'https://fcd.terra.dev/v1/txs?offset='+ returnData["next"] +'&account='+walletAddress+'&chainId=columbus-4&limit=500'
      returnData = await phin(query_url)
      returnData = JSON.parse(returnData.body)
      
  }

 return returnDatas
}




async function parse_wallet(walletAddress, parseMissing = true){
  const phin = require("phin");
    //https://fcd.terra.dev/v1/txs?account=terra1m3jg6rdylqnpwtuv6hs034n662w57qyzen6t6s&limit=500&chainId=columbus-4
  
  var query_url = 'https://fcd.terra.dev/v1/txs?account='+walletAddress+'&chainId=columbus-4&limit=500'
  var txhash
  var earlyExit = false
  var entry   
  var returnData = await phin(query_url)
    
    returnData = JSON.parse(returnData.body)

  while (exists(returnData)){

      for (const txData of returnData["txs"]) {  
          if ((exists (txData["txhash"])) == true){
            txhash = txData["txhash"]
          
            if (await isTxHashUnique (txhash,walletAddress) == true){
              
              //txType = classifyTransaction(txData)
              //output = await classifyandParseTransaction(txData,walletAddress)
              //Threads arnt really threads , this will hopefuly prevent conjestions in the processing queue from impacting website or api access. 

                if ( parserThreadCount > 10){
                  await sleep(1000)
                  parserThreadCount = parserThreadCount -1
                }
                try { 
                      parserThreadCount = parserThreadCount + 1

                      classifyandParseTransaction(txData,walletAddress).then(output => {

                      if (output != false){
                        
                        var logLen = output.length
          
                        for (let li = 0; li < logLen; li = li + 1) {
                          try {
                            
                                  entry =  transactionData.create(output[li]);    
                                  parserThreadCount = parserThreadCount -1
                              } catch (error) {
                          console.error('Unable to connect to the database:', error);
                          }
                        }
                      }
                  })
                }catch{
                  console.log (returnData["txs"])
                }

              }else{
                //exits the parser because we already have all the txes
                earlyExit = true
                //breaks inner loop processing fcd page 
                break
              }
          }else{
            console.log (txdata)
          }
        }

        if ((exists (returnData["next"]) == false) || (earlyExit == true)){
          //breaks main loop
          break
        }

      var query_url = 'https://fcd.terra.dev/v1/txs?offset='+ returnData["next"] +'&account='+walletAddress+'&chainId=columbus-4&limit=500'
      returnData = await phin(query_url)
      returnData = JSON.parse(returnData.body)

  }

  if ( parseMissing == true){
  //queries CW20 transactions from terra mantle, finds all addresses that have sent coins to target address
  //parses each of those addresses then finds missing tranactions for the target wallet

    //await parse_missing_transactions(walletAddress)
    //await match_missing_transactions(walletAddress)
  }
  await parse_anchor_liquidations(walletAddress)
  var index = addressParseQueue.indexOf(walletAddress);
  if (index > -1) {
    addressParseQueue.splice(index, 1);
    console.log ("Parsing  " + walletAddress + " complete")
  }

}


  async function parse_missing_transactions(walletAddress)
{
  var reconcileParseQueue = []
  //Uses graphql-request to query terra mantle for all CW20 tokens for a given address
  //Using this query a list of unique addresses who sent coins to our target wallet will be identified.
  //These wallets will then be parsed
  //once parsed we will find the missing transactions for our target wallet and then dupliucate the transaction in our transactiondata database. 
  const query = gql`
  query { 
    CW20Transfers (
      Limit:9000
      Recipient: "` + walletAddress +`"
    )
  {Address Amount Sender TransferType Height Recipient}
  }
`
  var queryUrl = 'https://mantle.terra.dev'

  var returnData = await request(queryUrl, query)

  var transfers = returnData["CW20Transfers"]
  for (let li = 0; li < transfers.length; li++){
    if (transfers[li]["TransferType"] == "receive"){
      
      var index = reconcileParseQueue.indexOf(transfers[li]["Sender"]);
      if (index < 0) {
        reconcileParseQueue.push(transfers[li]["Sender"]);
      }
    
    }
  }
//loop identified wallets
  for (let li = 0; li < reconcileParseQueue.length; li++){

      var addressParseQueueIndex = addressParseQueue.indexOf(reconcileParseQueue[li]);
      while (addressParseQueueIndex > -1){
      await sleep(100)
        var addressParseQueueIndex = addressParseQueue.indexOf(reconcileParseQueue[li]);
      }
      addressParseQueue.push(reconcileParseQueue[li]);
      console.log ("Parsing wallet " + reconcileParseQueue[li])
      await parse_wallet (reconcileParseQueue[li], false)
      var addressParseQueueIndex = addressParseQueue.indexOf(reconcileParseQueue[li]);
      addressParseQueue.splice(addressParseQueueIndex, 1);



    
  }
  console.log ("Parsing external wallets complete " )

}

async function match_missing_transactions(walletAddress){
  var returnDatas = []
  var returnVar
  var missingDatas = await transactionData.findAll({
  where: {
      transaction_to: walletAddress,
      wallet_address: {
        [Sequelize.Op.not]: walletAddress
      }
    },
    order: [
      // sort by blockheight
      ['block_height', 'ASC'],
    ]
  });

  for (let li = 0; li < missingDatas.length; li = li + 1) {
    var missingDataset = missingDatas[li]["dataValues"]
    if (await isTxHashUnique (missingDataset["txhash"],walletAddress) ) { 

      returnVar= {
        wallet_address : walletAddress,
        transaction_timestamp: missingDataset["transaction_timestamp"],
        transaction_timestamp_string:missingDataset["transaction_timestamp_string"],
        transaction_from: missingDataset["transaction_from"],
        transaction_to: missingDataset["transaction_to"],
        memo: missingDataset["memo"],
        amount_received: missingDataset["amount_sent"],
        amount_sent: "" ,
        contract_address: "",
        sent_currency: "",
        received_currency:missingDataset["sent_currency"],
        net_worth_amount: "",
        net_worth_currency: "",
        fee_amount:missingDataset["fee_amount"],
        fee_currency: missingDataset["fee_currency"],
        token_sent_address: "",
        token_received_address: missingDataset["token_received_address"],
        transaction_type: missingDataset["transaction_type"],
        koinly_label:  missingDataset["koinly_label"],
        friendly_description : "Deposit " + missingDataset["amount_sent"] + " " + missingDataset["sent_currency"] + " from " + missingDataset["wallet_address"],
        txhash: missingDataset["txhash"],
        block_height : missingDataset["block_height"]
      }
      console.log ("found missing: " + missingDataset["txhash"] )
      try {                     
          var entry =  transactionData.create(returnVar);    
          
      } catch (error) {
        console.error('Unable to connect to the database:', error);
      }

    }
      
  }

}

async function parse_anchor_liquidations(walletAddress){
  const phin = require("phin");
  //https://fcd.terra.dev/v1/txs?account=terra1m3jg6rdylqnpwtuv6hs034n662w57qyzen6t6s&limit=500&chainId=columbus-4

  var query_url = 'https://api.anchorprotocol.com/api/history/'+walletAddress
  var txhash
  var output
  var txType
  var txData
  var txDesc
  var entry   
  var returnData = await phin(query_url)
  
  returnData = JSON.parse(returnData.body)
  while (exists(returnData)){

    //console.log (returnData)

    for (txData of returnData["history"]) {  
      txhash = txData["tx_hash"]
      txType = txData["tx_type"]
      txDesc = txData["descriptions"][0]

      if (await isTxHashUnique (txhash,walletAddress) == true){
      //console.log(txData["descriptions"][0])
      if ((txType == "Liquidation") && ((txDesc.indexOf("Liquidator") > -1 ) || (txDesc.indexOf("Liquidated") > -1 ))){
      output = await parseLiquidationsAnchorApi(txData,walletAddress)
      //console.log(output)
      if ( typeof output !== 'undefined'){
        var logLen = output.length

          for (let li = 0; li < logLen; li = li + 1) {
            try {
              
                  entry = await transactionData.create(output[li]);

                } catch (error) {

                  console.error('Unable to connect to the database:', error);
                }
              }
            }
          }
        }
      }

      if ( (exists (returnData["next"]) == false) || ((returnData["next"]) == null)) {
        break
      }
      var query_url = 'https://api.anchorprotocol.com/api/history/'+walletAddress +'?offset=' + returnData["next"]
      returnData = await phin(query_url)
      returnData = JSON.parse(returnData.body)

    }
}
  

async function loadCwTokensJson(){
  const phin = require("phin");

  var query_url = 'https://raw.githubusercontent.com/terra-money/assets/master/cw20/tokens.json'

  var returnData = await phin(query_url)

    returnData = JSON.parse(returnData.body)
    if (exists(returnData["mainnet"])){
      return (returnData["mainnet"])
    }

  return false
}

async function loadLpTokensJson(){
  const phin = require("phin");
  
  var query_url = 'https://raw.githubusercontent.com/Papi94/assets/master/cw20/contracts.json'
  
  var returnData = await phin(query_url)
  
  returnData = JSON.parse(returnData.body)
  if (exists(returnData["mainnet"])){
    return (returnData["mainnet"])
  }

return false
}
  


    //init database
async function initTokenLists(){
  var cw20TokenList = await loadCwTokensJson()
  var lpTokenList = await loadLpTokensJson()
    coinLists = {
      "native" : nativeTokensList,
      "cw20"  : cw20TokenList,
      "lp" : lpTokenList
    }
    initCoinList(coinLists)
  } 



 async function isTxHashUnique (txhash,address) {
    var response = await transactionData.findOne({
      where: {
          txhash: txhash,
          wallet_address:address
        }
      });
    
      
      if (response == null){ 
        return true
      }
      return false
  }

  function exists (input){
    if(typeof input === 'undefined') {
        return false
    }
    else {
        return true
    }
}
function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

 

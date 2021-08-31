import {checkTx,initLCD,getCW20Info, sleep } from './parserlib/lcd.js'

import {parseContractActions,parseTransfer,findAttributes,parseExecuteContracts,parseContractEvents,parseNativeRewards,parseNativeDelegation } from './parserlib/events.js'

import {getTxType} from './parserlib/classifier.js'
import {parseMultipleOutputs,parseLpOut,CW20Lookup,parseMultipleInputs,parseLpIn,parseGenericSendReceive,parseTxFees,parseSingleInput,parseSingleOutput} from './parserlib/parser.js'
var coinLookup = {}

const lcd = initLCD("https://lcd.terra.dev","columbus-4");

//const init = async () => {
export async function initCoinList(input){
  coinLookup = input
}
export async function classifyTransactionByTxHash(txHash){
  var txData = await checkTx(txHash,60,lcd)
 return await classifyTransaction(txData)
}

export async function classifyTransaction(txData){
  return await getTxType(txData,lcd)
}
export async function classifyAndParseTransactionByTxHash(txHash,walletAddress){
  var txData = await checkTx(txHash,60,lcd)
  console.log (txData)
 return await classifyandParseTransaction(txData,walletAddress)
}

export async function parseLiquidationsAnchorApi(txData,walletAddress){
  var txhash = txData["tx_hash"]
  var txType = txData["tx_type"]
  var txDesc = txData["descriptions"][0]
  var txTimestamp = txData["timestamp"]
  var returnVars = []
  var lcdTxData = await checkTx(txhash,60,lcd)
  var txFees = parseTxFees(lcdTxData,coinLookup["native"])
  var txFee = txFees[0]
  
  var tmpTimestamp = lcdTxData["timestamp"]
  tmpTimestamp = tmpTimestamp.split ("T")
  var timestampString =tmpTimestamp[0] + " " + tmpTimestamp[1].replace("Z","") + " UTC"
  var blockHeight = lcdTxData["height"]


  if (exists (lcdTxData) ) { 
    if (exists (lcdTxData["logs"])){
      var parsedData = parseContractActions(lcdTxData["logs"][0]["events"])

  var liquidatedAssetAmount =  (parsedData["execute_bid"][0]["collateral_amount"] / 1000000)
  var liquidatedAssetToken = parsedData["execute_bid"][0]["collateral_token"] 
  var liquidatedAssetName = await CW20Lookup(liquidatedAssetToken,coinLookup,lcd)
  var liquidatedAssetName = liquidatedAssetName["symbol"]
  var repaidAmount = (parsedData["repay_stable"][0]["repay_amount"] / 1000000)
  var borrower = parsedData["liquidate_collateral"][0]["borrower"]
  var liquidator = parsedData["liquidate_collateral"][0]["liquidator"]
  if ((txType == "Liquidation") && (txDesc.indexOf("Liquidator") > -1 ) ){
//if wallet is being liquidated return swap entry and colateral repay transactionm

  var txFriendlyDescription = "Collateral liquidated" +" received " + repaidAmount  + "UST for" + liquidatedAssetAmount + " " +liquidatedAssetName + " Liquidator : "+ liquidator
  var txType = "AnchorLiquidated"
  var returnVar= {
    wallet_address : walletAddress,
    transaction_timestamp: lcdTxData["timestamp"],
    transaction_timestamp_string:timestampString,
    transaction_from: "",
    transaction_to: "",
    memo: "",
    amount_received: repaidAmount,
    amount_sent: liquidatedAssetAmount ,
    contract_address: "",
    sent_currency:liquidatedAssetName ,
    received_currency: "UST",
    net_worth_amount: "",
    net_worth_currency: "",
    fee_amount:txFee["fee_amount"] ,
    fee_currency: txFee["fee_currency"],
    token_sent_address: liquidatedAssetToken,
    token_received_address: "uusd",
    transaction_type:txType,
    koinly_label: "swap",
    friendly_description : txFriendlyDescription,
    txhash: txhash,
    block_height : blockHeight 
    
    
    }
    returnVars.push(returnVar)

    var txFriendlyDescription = "Repaid " + repaidAmount  + "UST towards Anchor loan (liquidated)"
    var returnVar= {
      wallet_address : walletAddress,
      transaction_timestamp: lcdTxData["timestamp"],
      transaction_timestamp_string:timestampString,
      transaction_from: "",
      transaction_to: "",
      memo: "",
      amount_received: "" ,
      amount_sent: repaidAmount ,
      contract_address: "",
      sent_currency:"UST" ,
      received_currency: "",
      net_worth_amount: "",
      net_worth_currency: "",
      fee_amount:"" ,
      fee_currency: "",
      token_sent_address: "uusd",
      token_received_address: "",
      transaction_type:txType,
      koinly_label: "anchorRepay",
      friendly_description : txFriendlyDescription,
      txhash: txhash,
      block_height : blockHeight 
      
      
      }

      returnVars.push(returnVar)
  }

  if ((txType == "Liquidation") && (txDesc.indexOf("Liquidated") > -1 )){
  //if wallet is liquidator then return swap transactions

      var txType = "AnchorLiquidation"
      var txFriendlyDescription = "Liquidated " + parsedData["repay_stable"][0]["borrower"] + " received " + liquidatedAssetAmount + " " + liquidatedAssetName + " for " + repaidAmount + " UST. "


    var returnVar= {
      wallet_address : walletAddress,
      transaction_timestamp: lcdTxData["timestamp"],
      transaction_timestamp_string:timestampString,
      transaction_from: "",
      transaction_to: "",
      memo: "",
      amount_received: liquidatedAssetAmount,
      amount_sent: repaidAmount ,
      contract_address: "",
      sent_currency: "UST",
      received_currency: liquidatedAssetName,
      net_worth_amount: "",
      net_worth_currency: "",
      fee_amount:txFee["fee_amount"] ,
      fee_currency: txFee["fee_currency"],
      token_sent_address: "uusd",
      token_received_address: liquidatedAssetToken,
      transaction_type:txType,
      koinly_label: "swap",
      friendly_description : txFriendlyDescription,
      txhash: txhash,
      block_height : blockHeight 
      
      
      }
      returnVars.push(returnVar)

    }
  }
}




 return returnVars
}
export async function classifyandParseTransaction(txData,walletAddress){
  
  if (exists (txData) ) { 
    if (exists (txData["logs"])){
    var parsedData = parseContractActions(txData["logs"][0]["events"])

    if(typeof parsedData == 'undefined'){
      if (exists(txData)){ 
        var fcdTxData = txData
      var txData = await checkTx(txData["txhash"],60,lcd)
      if (typeof txData == 'undefined') { 
        txData = fcdTxData
      }
      }
    }
  }
}


if (exists (txData)) { 
  var txType = await getTxType(txData,lcd)
    if (txType == false){
      //sometimes FCDs logs are corrupt? 
      //not sure but this works sometimes. 
      //var txData = await checkTx(txData["txhash"],60,lcd)
      //var txType = await getTxType(txData,lcd)
      //console.log (txhash)
    }
    
  if (txType == false){
    console.log (txData["txhash"])
  }
  //console.log (await  parseSingleInput(txData,lcd,walletAddress,coinLookup))
  //console.log (await parseLpOut(txData,lcd,walletAddress,coinLookup))
  //console.log (await parseLpIn(txData,lcd,walletAddress,coinLookup))//
  //console.log (await parseMultipleInputs(txData, lcd , walletAddress,coinLookup,true))
  //console.log (await parseSingleOutput(txData, lcd , walletAddress,coinLookup))


  if (txType == "tsLpAdd"){
    return (await parseLpIn(txData,lcd,walletAddress,coinLookup))
  }
  if (txType == "tsLpRemove"){
    return (await parseLpOut(txData,lcd,walletAddress,coinLookup))
  }

  return (await parseGenericSendReceive(txData, lcd , walletAddress,coinLookup,txType))
  }else{
    return false
  }
}


function exists (input){
  if(typeof input === 'undefined') {
      return false
  }
  else {
      return true
  }
}




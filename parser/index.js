import {checkTx,initLCD,getCW20Info } from './parserlib/lcd.js'

import {parseContractActions,parseTransfer,findAttributes,parseExecuteContracts,parseContractEvents,parseNativeRewards,parseNativeDelegation } from './parserlib/events.js'

import {getTxType} from './parserlib/classifier.js'
import {parseMultipleOutputs,parseLpOut,parseMultipleInputs,parseLpIn,parseGenericSendReceive,parseTxFees,parseSingleInput,parseSingleOutput} from './parserlib/parser.js'
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
 return await classifyandParseTransaction(txData,walletAddress)
}
export async function classifyandParseTransaction(txData,walletAddress){
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
 
}


function exists (input){
  if(typeof input === 'undefined') {
      return false
  }
  else {
      return true
  }
}




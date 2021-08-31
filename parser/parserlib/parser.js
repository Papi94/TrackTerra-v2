import {checkTx,initLCD,getCW20Info } from './lcd.js'
import {parseContractActions,parseTransfer,parseNativeRewards,parseNativeDelegation } from './events.js'

String.prototype.splitAndKeep = function(separator, method='seperate'){
    var str = this;
    if(method == 'seperate'){
        str = str.split(new RegExp(`(${separator})`, 'g'));
    }else if(method == 'infront'){
        str = str.split(new RegExp(`(?=${separator})`, 'g'));
    }else if(method == 'behind'){
        str = str.split(new RegExp(`(.*?${separator})`, 'g'));
        str = str.filter(function(el){return el !== "";});
    }
    return str;
};





//will parse swaps , anchor minting/burning and rewards claiming, and CW20 and native send recives , it should also calcuate the shuttle fees for shuttle transactions .
export async function parseGenericSendReceive(txData,lcd,walletAddress,coinLookup,txType){
    var returnVar
    var shuttleFee
    var koinlyLabel
    var returnVars = []
    var isShuttle = false
    const shuttleFeeStartDate = Date.parse('18 Jan 2021 00:00:00 UTC');

    var genericParseInput = (await  parseSingleInput(txData,lcd,walletAddress,coinLookup))
    var genericParseOutput = (await parseSingleOutput(txData,lcd,walletAddress,coinLookup))
    
   if (((genericParseInput != false) || (genericParseOutput != false))){

    if (genericParseInput != false) {
        var fromAddress = (genericParseInput["fromAddress"])
        var amountReceived = (genericParseInput["amount"])
        var symbolReceived = (genericParseInput["currency"])
        var tokenAddressReceived = (genericParseInput["tokenAddress"])
    }else{
        var fromAddress =""
        var amountReceived = ""
        var symbolReceived = ""
        var tokenAddressReceived =""
    }

    if (genericParseOutput != false) {
        var toAddress = (genericParseOutput["toAddress"])
        var amountSent = (genericParseOutput["amount"])
        var symbolSent = (genericParseOutput["currency"])
        var tokenAddressSent = (genericParseOutput["tokenAddress"])
    }else{
        var toAddress =""
        var amountSent = ""
        var symbolSent = ""
        tokenAddressSent = ""
    }

        if(typeof txData["tx"]["memo"] === 'undefined'){
            var memo = ""
        }else{
            var memo = txData["tx"]["memo"]
        }
        var txhash = txData["txhash"]
        var blockHeight = txData["height"]
        var tmpTimestamp = txData["timestamp"]
        tmpTimestamp = tmpTimestamp.split ("T")
        var timestamp_string =tmpTimestamp[0] + " " + tmpTimestamp[1].replace("Z","") + " UTC"
        var txFees = parseTxFees(txData,coinLookup["native"])
        var txFee = txFees[0]

        //if coins are sent to eth shuttle or BSC shuttle
        //we calculate the shuttle fee first and subtract it from the transfer amount (this should help with koinly deposit/withdrawal matching )
        //shuttle fee wont be correct for non UST assets where the fee was less than 1$ in value
        //this is because the shuttle fee mechanism , when the fee is less than 1$ uses the current market price of an asset to calculate the fee at a vsalue of 1$
        //even if we did look up historic prices, i highly doubt this would be 100% accurate. 
        //for transfer where the fee was more than 1$ it should be 100% accurate.
        if ( ((toAddress == "terra13yxhrk08qvdf5zdc9ss5mwsg5sf7zva9xrgwgc") || (toAddress == "terra1g6llg3zed35nd3mh9zx6n64tfw3z67w2c48tn2")) && (Date.parse(timestamp_string) > shuttleFeeStartDate)){
            //if transfer is UST then we calculate actual fee , if transfer is not UST then we calculate a fee based on sentAmount * .01 , 
            //too much effort to lookup histroic prices for non UST pairs
            //may result in the fee being incorrect for smaller non ust bridge transactions.
            if (symbolSent == "UST"){
                shuttleFee = amountSent * 0.001

                if (shuttleFee < 1){
                    shuttleFee = 1
                }

            }else{
                shuttleFee = amountSent * 0.001
            }

            returnVar= {
                wallet_address : walletAddress,
                transaction_timestamp: txData["timestamp"],
                transaction_timestamp_string:timestamp_string,
                transaction_from: "",
                transaction_to: "",
                memo: memo,
                amount_received: "",
                amount_sent: shuttleFee ,
                contract_address: "",
                sent_currency: symbolSent,
                received_currency: "",
                net_worth_amount: "",
                net_worth_currency: "",
                fee_amount:"",
                fee_currency: "",
                token_sent_address: "",
                token_received_address: "",
                transaction_type:"shuttleFee",
                koinly_label: "cost",
                friendly_description : "Shuttle fee of " + shuttleFee  + " " + symbolSent + " for transaction " + txhash,
                txhash: txhash,
                block_height : blockHeight     
                }
                returnVars.push (returnVar)

                amountSent = amountSent - shuttleFee
            
        }

        //wallet is receiving 
        if ((genericParseInput != false) && (genericParseOutput == false)){

        if (txType != false){ 
            if (txType.indexOf("Rewards") !== -1){
                koinlyLabel = "staking"
            }else{
                koinlyLabel = "deposit"
            }
        }

            returnVar= {
                wallet_address : walletAddress,
                transaction_timestamp: txData["timestamp"],
                transaction_timestamp_string:timestamp_string,
                transaction_from: fromAddress,
                transaction_to: toAddress,
                memo: memo,
                amount_received: amountReceived,
                amount_sent: "" ,
                contract_address: "",
                sent_currency: "",
                received_currency:symbolReceived,
                net_worth_amount: "",
                net_worth_currency: "",
                fee_amount:txFee["fee_amount"],
                fee_currency: txFee["fee_currency"],
                token_sent_address: "",
                token_received_address: tokenAddressReceived,
                transaction_type: txType,
                koinly_label: koinlyLabel,
                friendly_description : "Deposit " + amountReceived + " " + symbolReceived + " from " + fromAddress,
                txhash: txhash,
                block_height : blockHeight 
                
                
                }
                returnVars.push (returnVar)
        }else if (((genericParseInput == false) && (genericParseOutput != false)) || (txType == "anchorRepay")){
        //wallet is sending

        returnVar= {
            wallet_address : walletAddress,
            transaction_timestamp: txData["timestamp"],
            transaction_timestamp_string:timestamp_string,
            transaction_from: fromAddress,
            transaction_to: toAddress,
            memo: memo,
            amount_received: "",
            amount_sent: amountSent ,
            contract_address: "",
            sent_currency: symbolSent,
            received_currency: "",
            net_worth_amount: "",
            net_worth_currency: "",
            fee_amount:txFee["fee_amount"] ,
            fee_currency: txFee["fee_currency"],
            token_sent_address: tokenAddressSent,
            token_received_address: "",
            transaction_type:txType,
            koinly_label: "withdraw",
            friendly_description : "Withdraw " + amountSent + " " + symbolSent + " to " + toAddress,
            txhash: txhash,
            block_height : blockHeight 
            
            
            }

            returnVars.push (returnVar)

        }else if ((genericParseInput != false) && (genericParseOutput != false)){
            // sending and receiving
            
            
            if ((txType == "anchorMint") || (txType == "anchorRedeem") || (txType == "tsSwap")  || (txType == "anchorBlunaMint")){

                returnVar= {
                    wallet_address : walletAddress,
                    transaction_timestamp: txData["timestamp"],
                    transaction_timestamp_string:timestamp_string,
                    transaction_from: fromAddress,
                    transaction_to: toAddress,
                    memo: memo,
                    amount_received: amountReceived,
                    amount_sent: amountSent ,
                    contract_address: "",
                    sent_currency: symbolSent,
                    received_currency: symbolReceived,
                    net_worth_amount: "",
                    net_worth_currency: "",
                    fee_amount:txFee["fee_amount"] ,
                    fee_currency: txFee["fee_currency"],
                    token_sent_address: tokenAddressSent,
                    token_received_address: tokenAddressReceived,
                    transaction_type:txType,
                    koinly_label: "swap",
                    friendly_description : "Swap " + amountSent + " " + symbolSent + " to " + amountReceived + " "+ symbolReceived,
                    txhash: txhash,
                    block_height : blockHeight 
                    
                    
                    }
        
                    returnVars.push (returnVar)
            }
//this can handle most non swap single input single output transactions
//input and output trnsactions are treated as seperate . 
// Txtype is used as a filter to ensure transactions are processed deliberately 
            if ((txType == "mirrorCloseShortFarm") || (txType == "mirrorCloseCDP") || (txType == "mirrorOpenCDP")){
                returnVar= {
                    wallet_address : walletAddress,
                    transaction_timestamp: txData["timestamp"],
                    transaction_timestamp_string:timestamp_string,
                    transaction_from: fromAddress,
                    transaction_to: toAddress,
                    memo: memo,
                    amount_received: amountReceived,
                    amount_sent: "" ,
                    contract_address: "",
                    sent_currency: "",
                    received_currency:symbolReceived,
                    net_worth_amount: "",
                    net_worth_currency: "",
                    fee_amount:txFee["fee_amount"],
                    fee_currency: txFee["fee_currency"],
                    token_sent_address: "",
                    token_received_address: tokenAddressReceived,
                    transaction_type: txType,
                    koinly_label:  "deposit",
                    friendly_description : "Deposit " + amountReceived + " " + symbolReceived + " from " + fromAddress,
                    txhash: txhash,
                    block_height : blockHeight 
                    
                    
                    }

                            
                    returnVars.push (returnVar)

                    
                    returnVar= {
                        wallet_address : walletAddress,
                        transaction_timestamp: txData["timestamp"],
                        transaction_timestamp_string:timestamp_string,
                        transaction_from: fromAddress,
                        transaction_to: toAddress,
                        memo: memo,
                        amount_received: "",
                        amount_sent: amountSent ,
                        contract_address: "",
                        sent_currency: symbolSent,
                        received_currency: "",
                        net_worth_amount: "",
                        net_worth_currency: "",
                        fee_amount:"" ,
                        fee_currency: "",
                        token_sent_address: tokenAddressSent,
                        token_received_address: "",
                        transaction_type:txType,
                        koinly_label: "withdraw",
                        friendly_description : "Withdraw " + amountSent + " " + symbolSent + " to " + toAddress,
                        txhash: txhash,
                        block_height : blockHeight 
                        
                        
                        }

                        returnVars.push (returnVar)
            }


        }




        //record additional tx fees (tax) on withdrawals only. 
        if ((txFees.length > 1) && (toAddress != walletAddress)){
            returnVar= {
                wallet_address : walletAddress,
                transaction_timestamp: txData["timestamp"],
                transaction_timestamp_string:timestamp_string,
                transaction_from: "",
                transaction_to: "",
                memo: memo,
                amount_received: "",
                amount_sent: txFees[1]["fee_amount"] ,
                contract_address: "",
                sent_currency: txFees[1]["fee_currency"],
                received_currency: "",
                net_worth_amount: "",
                net_worth_currency: "",
                fee_amount:"",
                fee_currency: "",
                token_sent_address: "",
                token_received_address: "",
                transaction_type:"additionalFee",
                koinly_label: "cost",
                friendly_description : "Additional tx fee of " + txFees[1]["fee_amount"]  + " " + txFees[1]["fee_currency"] + " for transaction " + txhash,
                txhash: txhash,
                block_height : blockHeight
                }
                returnVars.push (returnVar)
        }






        return returnVars

    }else{
        return false
    }
}




export async function parseLpOut(txData,lcd,walletAddress,coinLookup){
    
    var lpTokenName  
    var txhash = txData["txhash"]
    var blockHeight = txData["height"]
    var tmpTimestamp = txData["timestamp"]
    tmpTimestamp = tmpTimestamp.split ("T")
    var timestamp_string =tmpTimestamp[0] + " " + tmpTimestamp[1].replace("Z","") + " UTC"
    var txFees = parseTxFees(txData,coinLookup["native"])
    var txFee = txFees[0]
    var returnVar
    var returnVars = []
    var netWorthUsd = ""

    var output =await parseSingleOutput(txData, lcd , walletAddress,coinLookup)                                                                           //will allow parser to parse the lp mint amount that the contract receives in the case of autostake transactions 
    var inputs = await parseMultipleInputs(txData, lcd , walletAddress,coinLookup, true) 


    if ((inputs.length == 2) && (output !=false)){
        
//name the lp token , if UST is in the pair UST will be the second token always 


        if ((inputs[0]["currency"] == "UST") || (inputs[1]["currency"] == "UST")){

            if ((inputs[0]["currency"] != "UST")){
                lpTokenName  =  inputs[0]["currency"] + "-UST-LP"
                netWorthUsd = inputs[1]["amount"]
            }else if ((inputs[1]["currency"] != "UST")){
                lpTokenName  =  inputs[1]["currency"] + "-UST-LP"
                netWorthUsd = inputs[0]["amount"]
            }
        }else{
            lpTokenName  =  inputs[0]["currency"] + "-" + inputs[1]["currency"] + "-LP"
        }


       var lpAmountHalf = parseFloat(output["amount"] / 2).toFixed(6)


        //LPin or LP creation transactions will result in the creation of two swap transactions
        returnVar= {
            wallet_address : walletAddress,
            transaction_timestamp: txData["timestamp"],
            transaction_timestamp_string:timestamp_string,
            transaction_from: inputs[0]["fromAddress"],
            transaction_to: walletAddress,
            memo: "",
            amount_received: inputs[0]["amount"],
            amount_sent: lpAmountHalf,
            contract_address: inputs[0]["fromAddress"],
            sent_currency: lpTokenName,
            received_currency: inputs[0]["currency"],
            net_worth_amount: netWorthUsd,
            net_worth_currency: "USD",
            fee_amount:txFee["fee_amount"],
            fee_currency: txFee["fee_currency"],
            token_sent_address: "",
            token_received_address: "",
            transaction_type: "tsLpRemove",
            koinly_label: "swap",
            friendly_description : "LP In 1 of 2 " + inputs[0]["amount"] + " " +  inputs[0]["currency"] + " for " + lpAmountHalf + " " + lpTokenName ,
            txhash: txhash,
            block_height : blockHeight 
            
            
            }
            returnVars.push (returnVar)

                    //the fee is included in the first transaction
                    returnVar= {
                        wallet_address : walletAddress,
                        transaction_timestamp: txData["timestamp"],
                        transaction_timestamp_string:timestamp_string,
                        transaction_from: inputs[0]["fromAddress"],
                        transaction_to: walletAddress,
                        memo: "",
                        amount_received: inputs[1]["amount"],
                        amount_sent: lpAmountHalf,
                        contract_address: inputs[0]["fromAddress"],
                        sent_currency: lpTokenName,
                        received_currency: inputs[1]["currency"],
                        net_worth_amount: netWorthUsd,
                        net_worth_currency: "USD",
                        fee_amount:"",
                        fee_currency: "",
                        token_sent_address: "",
                        token_received_address: "",
                        transaction_type: "tsLpRemove",
                        koinly_label: "swap",
                        friendly_description : "LP In 2 of 2 " + inputs[1]["amount"] + " " +  inputs[1]["currency"] + " for " + lpAmountHalf + " " + lpTokenName ,
                        txhash: txhash,
                        block_height : blockHeight 
                        
                        
                        }
            returnVars.push (returnVar)


    }else{
        return false
    }

    return returnVars

}




export async function parseLpIn(txData,lcd,walletAddress,coinLookup){
    var outputs = await parseMultipleOutputs(txData, lcd , walletAddress,coinLookup)
    var lpTokenName  
    var txhash = txData["txhash"]
    var blockHeight = txData["height"]
    var tmpTimestamp = txData["timestamp"]
    tmpTimestamp = tmpTimestamp.split ("T")
    var timestamp_string =tmpTimestamp[0] + " " + tmpTimestamp[1].replace("Z","") + " UTC"
    var txFees = parseTxFees(txData,coinLookup["native"])
    var txFee = txFees[0]
    var returnVar
    var returnVars = []
    var netWorthUsd = ""

  
    var input = await parseSingleInput(txData, lcd , walletAddress,coinLookup, true)


    if ((outputs.length == 2) && (input !=false)){
        
//name the lp token , if UST is in the pair UST will be the second token always 


        if ((outputs[0]["currency"] == "UST") || (outputs[1]["currency"] == "UST")){

            if ((outputs[0]["currency"] != "UST")){
                lpTokenName  =  outputs[0]["currency"] + "-UST-LP"
                netWorthUsd = outputs[0]["amount"]
            }else if ((outputs[1]["currency"] != "UST")){
                lpTokenName  =  outputs[1]["currency"] + "-UST-LP"
                netWorthUsd = outputs[0]["amount"]
            }
        }else{
            lpTokenName  =  outputs[0]["currency"] + "-" + outputs[1]["currency"] + "-LP"
        }


       var lpAmountHalf = parseFloat(input["amount"] / 2).toFixed(6)


        //LPin or LP creation transactions will result in the creation of two swap transactions
        returnVar= {
            wallet_address : walletAddress,
            transaction_timestamp: txData["timestamp"],
            transaction_timestamp_string:timestamp_string,
            transaction_from: walletAddress,
            transaction_to: outputs[0]["toAddress"],
            memo: "",
            amount_received: lpAmountHalf,
            amount_sent: outputs[0]["amount"] ,
            contract_address: outputs[0]["toAddress"],
            sent_currency: outputs[0]["currency"],
            received_currency: lpTokenName,
            net_worth_amount: netWorthUsd,
            net_worth_currency: "USD",
            fee_amount:txFee["fee_amount"],
            fee_currency: txFee["fee_currency"],
            token_sent_address: "",
            token_received_address: "",
            transaction_type: "tsLpAdd",
            koinly_label: "swap",
            friendly_description : "LP In 1 of 2 " + outputs[0]["amount"] + " " +  outputs[0]["currency"] + " for " + lpTokenName ,
            txhash: txhash,
            block_height : blockHeight 
            
            
            }
            returnVars.push (returnVar)

                    //the fee is included in the first transaction
        returnVar= {
            wallet_address : walletAddress,
            transaction_timestamp: txData["timestamp"],
            transaction_timestamp_string:timestamp_string,
            transaction_from: walletAddress,
            transaction_to: outputs[1]["toAddress"],
            memo: "",
            amount_received: lpAmountHalf,
            amount_sent: outputs[1]["amount"] ,
            contract_address: outputs[0]["toAddress"],
            sent_currency: outputs[1]["currency"],
            received_currency: lpTokenName,
            net_worth_amount: netWorthUsd,
            net_worth_currency: "",
            fee_amount: "",
            fee_currency: "",
            token_sent_address: "",
            token_received_address: "",
            transaction_type: "tsLpAdd",
            koinly_label: "swap",
            friendly_description : "LP In 2 of 2 " + outputs[1]["amount"] + " " +  outputs[1]["currency"] + " for " + lpTokenName ,
            txhash: txhash,
            block_height : blockHeight 
            
            
            }
            returnVars.push (returnVar)


    }else{
        return false
    }

    return returnVars

}

export async function parseSingleInput(txData,lcd,walletAddress,coinLookup,parseNested = false){
var returnVar
var item
var tokenName
var amount
var contract
var fromAddress = "unknown"

if (exists(txData["logs"])){ 
    var logLen = txData["logs"].length

    for (let li = 0; li < logLen; li = li + 1) {

        var parsedNativeTransfers = parseTransfer(txData["logs"][li]["events"])
        if (exists(parsedNativeTransfers)){ 

            var len = parsedNativeTransfers.length
            for (let i = 0; i < len; i = i + 1) {
                item = parsedNativeTransfers[i];

                if (item["to"] == walletAddress){   
                    tokenName=  coinLookup["native"][item["denom"]]
                    fromAddress = item["from"] 
                    amount=  item["amount"]
                    returnVar= {
                        amount: (amount / 1000000),
                        currency: tokenName,
                        fromAddress :fromAddress,
                        tokenAddress : item["denom"]
                    }
                    return returnVar
                }

            }

        }
        //returns contract events including cw20 transfers
        var parsedContractData = parseContractActions(txData["logs"][li]["events"])
        if (exists(parsedContractData)) {

            if (exists(parsedContractData["transfer"])){ 
            
                len = parsedContractData["transfer"].length
                    for (let i = 0; i < len; i = i + 1) {

                        item = parsedContractData["transfer"][i]

                        if (item["to"] == walletAddress){  
                        fromAddress = item["from"] 
                        contract = item["contract"]

                        amount =  item["amount"]
                        let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                        tokenName=  CW20Info ["symbol"]
                        returnVar= {
                            amount: (amount / 1000000),
                            currency: tokenName,
                            fromAddress :fromAddress ,
                            tokenAddress : contract
                        }
                        return returnVar

                    }
                }
            }


            if (exists(parsedContractData["mint"])){ 
            
                len = parsedContractData["mint"].length
                    for (let i = 0; i < len; i = i + 1) {

                        item = parsedContractData["mint"][i]

                        if (item["to"] == walletAddress){  
                            fromAddress = "contract"
                        contract = item["contract"]

                        amount =  item["amount"]
                        let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                        tokenName=  CW20Info ["symbol"]
                        returnVar= {
                            amount: (amount / 1000000),
                            currency: tokenName,
                            fromAddress :fromAddress ,
                            tokenAddress : contract
                        }
                        return returnVar

                    }
                }
            }
            if (parseNested == true){

                if (exists(parsedContractData["mint"])){ 
                        
                    len = parsedContractData["mint"].length
                        for (let i = 0; i < len; i = i + 1) {

                            item = parsedContractData["mint"][i]

                                fromAddress = "contract"
                            
                        if (exists (item["amount"])){
                            contract = item["contract"]
                            amount =  item["amount"]
                            let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                            tokenName=  CW20Info ["symbol"]
                            returnVar= {
                                amount: (amount / 1000000),
                                currency: tokenName,
                                fromAddress :fromAddress ,
                                tokenAddress : contract
                            }
  
                            return returnVar
                        }
                    
                    }
                }




            }

            
            if (exists(parsedContractData["withdraw"])){ 
            
                len = parsedContractData["withdraw"].length
                    for (let i = 0; i < len; i = i + 1) {

                        item = parsedContractData["withdraw"][i]

                        if (item["to"] == walletAddress){  
                            fromAddress = "contract"
                        contract = item["contract"]

                        amount =  item["amount"]
                        let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                        tokenName=  CW20Info ["symbol"]
                        returnVar= {
                            amount: (amount / 1000000),
                            currency: tokenName,
                            fromAddress :fromAddress,
                            tokenAddress : contract 
                        }
                        return returnVar

                    }
                }
            }


        }
    }
}

return false
}


export async function parseSingleOutput(txData,lcd,walletAddress,coinLookup,parseNested = false){
    //if a native transaction contains two transfers the largest transfer will be considered (the smaller one is probably tax)
var toAddress = "unknown"
var returnVar
var item
var tokenName
var amount
var contract
var matchFound 
if (exists (txData["logs"])){ 
    var logLen = txData["logs"].length

    for (let li = 0; li < logLen; li = li + 1) {

    var parsedNativeTransfers = parseTransfer(txData["logs"][li]["events"])

        if (exists(parsedNativeTransfers)){ 
        var len = parsedNativeTransfers.length
        matchFound = false
        for (let i = 0; i < len; i = i + 1) {
            item = parsedNativeTransfers[i];

            if (item["from"] == walletAddress){ 
                if ((matchFound == true) && (amount < item["amount"]) ) {
                    tokenName=  coinLookup["native"][item["denom"]]
                    toAddress = item["to"] 
                    amount=  item["amount"]
                    matchFound = true


                }else if(matchFound == false){
                    tokenName=  coinLookup["native"][item["denom"]]
                    amount=  item["amount"]
                    toAddress = item["to"] 
                    matchFound = true
                }

            }
        
        }
        if (matchFound == true) { 
            returnVar= {
                amount: (amount / 1000000),
                currency: tokenName,
                toAddress: toAddress,
                tokenAddress : item["denom"]
            }
            return returnVar
        }
        }




        //returns contract events including cw20 transfers
        var parsedContractData = parseContractActions(txData["logs"][li]["events"])
        if (exists(parsedContractData)) {


            if (exists(parsedContractData["transfer"])){ 
            
                len = parsedContractData["transfer"].length
                    for (let i = 0; i < len; i = i + 1) {

                        item = parsedContractData["transfer"][i]

                        if (item["from"] == walletAddress){  
                        toAddress = item["to"] 
                        contract = item["contract"]

                        amount =  item["amount"]
                        let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                        tokenName=  CW20Info ["symbol"]
                        returnVar= {
                            amount: (amount / 1000000),
                            currency: tokenName,
                            toAddress: toAddress,
                            tokenAddress : contract
                        }
                        return returnVar

                    }
                }
            }

            if (exists(parsedContractData["send"])){ 
            
                len = parsedContractData["send"].length
                    for (let i = 0; i < len; i = i + 1) {

                        item = parsedContractData["send"][i]

                        if (item["from"] == walletAddress){  

                        contract = item["contract"]
                        toAddress = item["to"] 
                        amount =  item["amount"]
                        let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                        tokenName=  CW20Info ["symbol"]
                        returnVar= {
                            amount: (amount / 1000000),
                            currency: tokenName,
                            toAddress: toAddress,
                            tokenAddress : contract
                        }
                        return returnVar

                    }
                }
            }

            if (exists(parsedContractData["burn"])){ 
            
                len = parsedContractData["burn"].length
                    for (let i = 0; i < len; i = i + 1) {

                        item = parsedContractData["burn"][i]

                        if (item["from"] == walletAddress){  
                            toAddress = "contract"
                        contract = item["contract"]

                        amount =  item["amount"]
                        let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                        tokenName=  CW20Info ["symbol"]
                        returnVar= {
                            amount: (amount / 1000000),
                            currency: tokenName,
                            toAddress: toAddress,
                            tokenAddress : contract
                        }
                        return returnVar

                    }
                }
            }



        if (parseNested == true){



            }

        }

    }
}
return false
}

export async function parseMultipleInputs(txData,lcd,walletAddress,coinLookup, parseAutostake = false){
    //if parse autostake is enabled all uLP transfers will not be returned. 
    //if a native transaction contains two transfers the largest transfer will be considered (the smaller one is probably tax)
    var toAddress = "unknown"
    var returnVar
    var item
    var tokenName
    var amount
    var contract
    var matchFound 
    var returnVars = []
    //returns native transfers


    var returnVar
    var item
    var tokenName
    var amount
    var contract
    var fromAddress = "unknown"

    if (exists(txData["logs"])){ 
        var logLen = txData["logs"].length

        for (let li = 0; li < logLen; li = li + 1) {

            var parsedNativeTransfers = parseTransfer(txData["logs"][li]["events"])
            if (exists(parsedNativeTransfers)){ 

                var len = parsedNativeTransfers.length
                for (let i = 0; i < len; i = i + 1) {
                    item = parsedNativeTransfers[i];

                    if (item["to"] == walletAddress){   
                        tokenName=  coinLookup["native"][item["denom"]]
                        fromAddress = item["from"] 
                        amount=  item["amount"]
                        returnVar= {
                            amount: (amount / 1000000),
                            currency: tokenName,
                            fromAddress :fromAddress 
                        }
                        returnVars.push(returnVar)
                    }

                }

            }
            //returns contract events including cw20 transfers
            var parsedContractData = parseContractActions(txData["logs"][li]["events"])
            if (exists(parsedContractData)) {

                if (exists(parsedContractData["transfer"])){ 
                
                    len = parsedContractData["transfer"].length
                        for (let i = 0; i < len; i = i + 1) {

                            item = parsedContractData["transfer"][i]

                            if (item["to"] == walletAddress){  
                            fromAddress = item["from"] 
                            contract = item["contract"]

                            amount =  item["amount"]
                            let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                            tokenName=  CW20Info ["symbol"]
                            returnVar= {
                                amount: (amount / 1000000),
                                currency: tokenName,
                                fromAddress :fromAddress 
                            }
                            if ((parseAutostake == true) && (returnVar["currency"].indexOf("-LP") > 0)) {
                                //dont return returnvar
                            }else{
                                returnVars.push(returnVar)
                            }
                        }
                    }
                }


                if (exists(parsedContractData["mint"])){ 
                
                    len = parsedContractData["mint"].length
                        for (let i = 0; i < len; i = i + 1) {

                            item = parsedContractData["mint"][i]

                            if (item["to"] == walletAddress){  
                                fromAddress = "contract"
                            contract = item["contract"]

                            amount =  item["amount"]
                            let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                            tokenName=  CW20Info ["symbol"]
                            returnVar= {
                                amount: (amount / 1000000),
                                currency: tokenName,
                                fromAddress :fromAddress 
                            }
                            if ((parseAutostake == true) && (returnVar["currency"].indexOf("-LP") > 0)) {
                                //dont return returnvar
                            }else{
                                returnVars.push(returnVar)
                            }

                        }
                    }
                }
                if (parseAutostake == true){
                    if (exists(parsedContractData["mint"])){ 
                            
                        len = parsedContractData["mint"].length
                            for (let i = 0; i < len; i = i + 1) {

                                item = parsedContractData["mint"][i]

                                    fromAddress = "contract"
                                contract = item["contract"]

                                amount =  item["amount"]
                                let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                                tokenName=  CW20Info ["symbol"]
                                returnVar= {
                                    amount: (amount / 1000000),
                                    currency: tokenName,
                                    fromAddress :fromAddress 
                                }
                                if ((parseAutostake == true) && (returnVar["currency"].indexOf("-LP") > 0)) {
                                    //dont return returnvar
                                }else{
                                    returnVars.push(returnVar)
                                }

                        
                        }
                    }
                }

                
                if (exists(parsedContractData["withdraw"])){ 
                
                    len = parsedContractData["withdraw"].length
                        for (let i = 0; i < len; i = i + 1) {

                            item = parsedContractData["withdraw"][i]

                            if (item["to"] == walletAddress){  
                                fromAddress = "contract"
                            contract = item["contract"]

                            amount =  item["amount"]
                            let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                            tokenName=  CW20Info ["symbol"]
                            returnVar= {
                                amount: (amount / 1000000),
                                currency: tokenName,
                                fromAddress :fromAddress 
                            }
                            if ((parseAutostake == true) && (returnVar["currency"].indexOf("-LP") > 0)) {
                                //dont return returnvar
                            }else{
                                returnVars.push(returnVar)
                            }

                        }
                    }
                }


            }
        }
    }


    if (returnVars.length > 0){
        return returnVars
    }  

    return false
}


export async function parseMultipleOutputs(txData,lcd,walletAddress,coinLookup){
        //if a native transaction contains two transfers the largest transfer will be considered (the smaller one is probably tax)
    var toAddress = "unknown"
    var returnVar
    var item
    var tokenName
    var amount
    var contract
    var matchFound 
    var returnVars = []
    if (exists (txData["logs"])){ 
        var logLen = txData["logs"].length

        for (let li = 0; li < logLen; li = li + 1) {

        var parsedNativeTransfers = parseTransfer(txData["logs"][li]["events"])

            if (exists(parsedNativeTransfers)){ 
                var len = parsedNativeTransfers.length
                matchFound = false
                for (let i = 0; i < len; i = i + 1) {
                    item = parsedNativeTransfers[i];

                    if (item["from"] == walletAddress){ 

                            
                            tokenName=  coinLookup["native"][item["denom"]]
                            amount=  item["amount"]
                            toAddress = item["to"] 

                            returnVar= {
                                amount: (amount / 1000000),
                                currency: tokenName,
                                toAddress: toAddress
                            }
                            returnVars.push(returnVar)
                            matchFound = true
                        }

                    }
                
                }

            //returns contract events including cw20 transfers
            var parsedContractData = parseContractActions(txData["logs"][li]["events"])
            if (exists(parsedContractData)) {


                if (exists(parsedContractData["transfer"])){ 
                
                    len = parsedContractData["transfer"].length
                        for (let i = 0; i < len; i = i + 1) {

                            item = parsedContractData["transfer"][i]

                            if (item["from"] == walletAddress){  
                            toAddress = item["to"] 
                            contract = item["contract"]

                            amount =  item["amount"]
                            let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                            tokenName=  CW20Info ["symbol"]
                            returnVar= {
                                amount: (amount / 1000000),
                                currency: tokenName,
                                toAddress: toAddress
                            }
                            returnVars.push(returnVar)
                            //return returnVar

                        }
                    }
                }

                if (exists(parsedContractData["send"])){ 
                
                    len = parsedContractData["send"].length
                        for (let i = 0; i < len; i = i + 1) {

                            item = parsedContractData["send"][i]

                            if (item["from"] == walletAddress){  

                            contract = item["contract"]
                            toAddress = item["to"] 
                            amount =  item["amount"]
                            let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                            tokenName=  CW20Info ["symbol"]
                            returnVar= {
                                amount: (amount / 1000000),
                                currency: tokenName,
                                toAddress: toAddress
                            }
                            returnVars.push(returnVar)
                            //return returnVar

                        }
                    }
                }
                if (exists(parsedContractData["transfer_from"])){ 
                
                    len = parsedContractData["transfer_from"].length
                        for (let i = 0; i < len; i = i + 1) {

                            item = parsedContractData["transfer_from"][i]

                            if (item["from"] == walletAddress){  

                            contract = item["contract"]
                            toAddress = item["to"] 
                            amount =  item["amount"]
                            let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                            tokenName=  CW20Info ["symbol"]
                            returnVar= {
                                amount: (amount / 1000000),
                                currency: tokenName,
                                toAddress: toAddress
                            }
                            returnVars.push(returnVar)
                            //return returnVar

                        }
                    }
                }
                if (exists(parsedContractData["burn"])){ 
                
                    len = parsedContractData["burn"].length
                        for (let i = 0; i < len; i = i + 1) {

                            item = parsedContractData["burn"][i]

                            if (item["from"] == walletAddress){  
                                toAddress = "contract"
                            contract = item["contract"]

                            amount =  item["amount"]
                            let CW20Info = await CW20Lookup(contract,coinLookup,lcd )
                            tokenName=  CW20Info ["symbol"]
                            returnVar= {
                                amount: (amount / 1000000),
                                currency: tokenName,
                                toAddress: toAddress
                            }

                            returnVars.push(returnVar)
                        // return returnVar

                        }
                    }
                }
            }

        }
    }

    if (returnVars.length > 0){
        return returnVars
    }

return false
}


export function parseTxFees(txData,coinLookup){
    var arrFee
    var arrFees 
    var returnVar
    var fee_currency
    var fee_amount
    var returnVars =[]
    //parsing lcd fees is a bit messy, data is cleaner when it comes from fcd, hence fee parsing code is duplicated for both scenarios. 
    if ((exists (txData["tx"]["fee"])) || exists (txData["tx"]["value"]["fee"]) ){ 
        if ((exists (txData["tx"]["fee"]))) { 
            var tmp =  txData["tx"]["fee"]["amount"] + ""
        
        if (tmp.includes(",") == true ){
            arrFees = tmp.split(",")

            arrFees.forEach(function (item, index) {
                
                arrFee = item.splitAndKeep("[0-9]u", "behind")
                if (arrFee.length = 2){
                    if (exists(coinLookup["u" +arrFee[1]])){
                        fee_currency=coinLookup["u" +arrFee[1]]
                    }else{
                        fee_currency =arrFee[1]
                    }
                    returnVar= {
                            fee_amount: (arrFee[0].replace(/\D/g,'') / 1000000),
                            fee_currency: fee_currency,
                        }
                        returnVars.push(returnVar)
                    }
            });

        }else{ 
            arrFees = tmp.splitAndKeep("[0-9]u", "behind")

            if (arrFees.length = 2){

                if (exists(coinLookup["u" +arrFees[1]])){
                    fee_currency=coinLookup["u" +arrFees[1]]
                }else{
                    fee_currency =arrFees[1]
                }


                returnVar= {
                        fee_amount: (arrFees[0].replace(/\D/g,'') / 1000000),
                        fee_currency: fee_currency,
                    }
                    returnVars.push(returnVar)
                }
        }
    
        }else{
            //fees from fcd are parsed differently it seems 
            var tmp =  txData["tx"]["value"]["fee"]["amount"]

                for (let i = 0; i < tmp.length; i++){

                    if (exists(coinLookup[tmp[i]["denom"]])){
                        fee_currency=coinLookup[tmp[i]["denom"]]
                    }else{
                        fee_currency =tmp[i]["denom"]
                    }
                    fee_amount = tmp[i]["amount"]

                    returnVar= {
                        fee_amount: (fee_amount / 1000000),
                        fee_currency:fee_currency,
                    }
                    returnVars.push(returnVar)

                }

            }
    }else{
        returnVar= {
            fee_amount: 0,
            fee_currency: "",
        }
        returnVars.push(returnVar)
    }

return returnVars
}
export async function CW20Lookup (address,coinLookup,lcd){
    var returnVar = []
    
    if (exists(coinLookup["cw20"][address])){
        returnVar=coinLookup["cw20"][address]
    }else if (exists(coinLookup["lp"][address])){
        var lpName = coinLookup["lp"][address]["name"]
        returnVar["symbol"] = lpName.replace(" ","-")
    }else{
        //calls lcd if we dont have the address/symbol indexed
        returnVar = await getCW20Info(address,lcd)
    }

return returnVar
}

function exists (input){
    if(typeof input === 'undefined') {
        return false
    }
    else {
        return true
    }
}
import {checkTx,initLCD,getCW20Info } from './lcd.js'
import {parseContractActions,parseContractEvents,parseTransfer,parseNativeRewards,parseNativeDelegation } from './events.js'

/*
Transaction types


Anchor
anchorMint
anchorRedeemAust
Luna/bluna mint and burn (excludes "instant" transactions that are parsed via terraswap parser)
anchorBlunaMint
anchorBlunaBurn
anchorProvideColateral
anchorRemoveColateral
anchorBorrow
anchorRepay
anchorLpRewards
anchorBorrowRewards

anchorBlunaClaimRewards


Terraswap 
tsLpAdd
tsLpRemove
tsSwap

classifers done

Mirror v1

mirrorOpenCDP
MirrorCloseCDP
mirrorGovPool
mirrorStakeLp - ignore these i think
mirrorClaimRewards
mirrorLPPool -uneeded terraswap
mirrorLiquidated
mirrorLiquidate


isMirrorOpenShortFarm


Native

Generic
claimNativeRewards
NativeSend
NativeReceive
nativeDelegation
cw20Receive
cw20Send
Shuttle



To add support for a new type create an is Function, update the above documentation define trancation types, 
add your is (IE IsTransactionType) function to getTxType, then build a parser that returns a result that can be stored in the database, 
add a parser call for your transaction to to the parseTx function

amount_received, amount_sent, contract_address, validator_address, token_sent_address, token_received_address, token_sent_friendly_name, token_received_address_friendly_name, transaction_type, transaction_id, wallet_address,block_number

*/

export async function getTxType(txData,lcd){
    var txType 
    if (exists (txData["logs"])){ 
    //const txData =await checkTx(txId,60000,lcd)
    var parsedData = parseContractActions(txData["logs"][0]["events"])


    if (txData["txhash"] == "3BF4D86E3A92E3321E8A44751FA1837304C8BD448ADBDF530ED0E509619052CF"){
        console.log(parseContractActions(txData["logs"][0]["events"]))
    }


    if (isAnchorAustMint(txData)){
        txType = "anchorMint"
        return txType
    }

    if (isAnchorAustRedeem(txData)){
        txType = "anchorRedeem"
        return txType
    }
  if(exists(parsedData)) { 


        if (isTsSwap(txData)){
            txType = "tsSwap"
            return txType
        }
        if (isGovVote(txData)){
            txType = "govVote"
            return txType
        }

        if (isTsLpAdd(txData)){
            txType = "tsLpAdd"
            return txType
        }
        if (isTsLpRemove(txData)){
            txType = "tsLpRemove"
            return txType
        }

        if (isMirrorClaimRewards(txData)){
            txType = "mirrorClaimRewards"
            return txType
        }
        if (isAnchorBlunaMint(txData)){
            txType = "anchorBlunaMint"
            return txType
        }
        if (isAnchorBlunaBurn(txData)){
            txType = "anchorBlunaBurn"
            return txType
        }
        
        if (isAnchorColateralDeposit(txData)){
            txType = "anchorColateralDeposit"
            return txType
        }
        if (isAnchorColateralWithdrawal(txData)){
            txType = "anchorColateralWithdrawal"
            return txType
        }

        if (isAnchorBorrow(txData)){
            txType = "anchorBorrow"
            return txType
        }

        if (isAnchorRepay(txData)){
            txType = "anchorRepay"
            return txType
        }
        if (isAnchorLpClaimRewards(txData)){
            txType = "anchorLpClaimRewards"
            return txType
        }
        if (isAnchorBorrowClaimRewards(txData)){
            txType = "anchorBorrowClaimRewards"
            return txType
        }
        if (isAnchorBlunaClaimRewards(txData)){
            txType = "anchorBlunaClaimRewards"
            return txType
        }
        
        if (isMirrorOpenCDP(txData)){
            txType = "mirrorOpenCDP"
            return txType
        }
        if (isMirrorOpenShortFarm(txData)){
            txType = "mirrorOpenShortFarm"
            return txType
        }
        if (isMirrorCloseShortFarm(txData)){
            txType = "mirrorCloseShortFarm"
            return txType
        }
        if (isMirrorCloseCDP(txData)){
            txType = "mirrorCloseCDP"
            return txType
        }
        if (isMirrorGovUnstake(txData)){
            txType = "mirrorGovUnstake"
            return txType
        }
        if (isMirrorGovStake(txData)){
            txType = "mirrorGovStake"
            return txType
        }

        if (isMineClaimRewards(txData)){
            txType = "mineClaimRewards"
            return txType
        }    
        //uses lcd to look up CW20 contract
        if (isCW20SendReceive(txData,lcd)){
            txType = "CW20SendReceive"
            return txType
        }
        
        
  }


    if (isNativeDelegation(txData)){
        txType = "nativeDelegation"
        return txType
    }
    if (isNativeRewards(txData)){
        txType = "nativeRewardsClaim"
        return txType
    }

    if (isNativeSendReceive(txData)){
        txType = "nativeSendReceive"
        return txType
    }

    }

return false


}

function isCW20SendReceive(txData,lcd){
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
   if ( (exists (parsedData["transfer"]) )  && (exists (parsedData["mint"]) == false) && (exists (parsedData["withdraw"]) == false)){
       var contractAddress = parsedData["transfer"][0]["contract"]
      if(! getCW20Info(contractAddress,lcd ) == false) {
        return true
      }
 
     return false
    }
}
function isNativeSendReceive(txData){
    
    if (parseTransfer(txData["logs"][0]["events"]) == false){
        return false
       }else{
           return true
       }
}
function isGovVote(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
   if ( (exists (parsedData["cast_vote"]))){

        return true
    

   }
return false
}
function isNativeDelegation(txData){
    
    const parsedData = parseNativeDelegation(txData["logs"][0]["events"])
    if ( parsedData !== false){
        //var contractAddress = parsedData["mint"][0]["contract"]
        return true
 
    }
 
     return false
}



function isNativeRewards(txData){
    const parsedData = parseNativeRewards(txData["logs"][0]["events"])
    if ( parsedData !== false){
        //var contractAddress = parsedData["mint"][0]["contract"]
        return true
 
    }
 
     return false
 }



function isAnchorBlunaBurn(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
   if ( (exists (parsedData["burn"]))){
       var contractAddress = parsedData["burn"][0]["contract"]

       if (contractAddress == 'terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts'){ 
        return true
       }

   }


return false
}
function isAnchorBorrow(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
   if ( (exists (parsedData["borrow_stable"]))){
       var contractAddress = parsedData["borrow_stable"][0]["contract"]

       if (contractAddress == 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s'){ 
        return true
       }

   }
return false
}

function isMirrorOpenShortFarm(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])

 
    if ( (exists (parsedData["open_position"]) ) && (exists (parsedData["increase_short_token"]) == true )){
       var contractAddress = parsedData["open_position"][0]["contract"]

       if (contractAddress == 'terra1wfz7h3aqf4cjmjcvc6s8lxdhh7k30nkczyf0mj'){ 
        return true
       }

   }
return false
}

function isMirrorCloseShortFarm(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])

 
    if ( (exists (parsedData["send"]) ) && (exists (parsedData["decrease_short_token"]) == true )){
       var contractAddress = parsedData["send"][0]["to"]

       if (contractAddress == 'terra1wfz7h3aqf4cjmjcvc6s8lxdhh7k30nkczyf0mj'){ 
        return true
       }

   }
return false
}

function isMirrorOpenCDP(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
 
    if ( (exists (parsedData["open_position"]) ) && (exists (parsedData["increase_short_token"]) == false )){
       var contractAddress = parsedData["open_position"][0]["contract"]

       if (contractAddress == 'terra1wfz7h3aqf4cjmjcvc6s8lxdhh7k30nkczyf0mj'){ 
        return true
       }

   }
return false
}
function isMirrorCloseCDP(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
   if ( (exists (parsedData["burn"]))){
       var contractAddress = parsedData["burn"][0]["contract"]

       if (contractAddress == 'terra1wfz7h3aqf4cjmjcvc6s8lxdhh7k30nkczyf0mj'){ 
        return true
       }

   }
return false
}

function isMirrorGovStake(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
   if ( (exists (parsedData["staking"]))){
       var contractAddress = parsedData["staking"][0]["contract"]
       if (contractAddress == 'terra1wh39swv7nq36pnefnupttm2nr96kz7jjddyt2x'){ 
        return true
       }

   }
return false
}
function isMirrorGovUnstake(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
   if ( (exists (parsedData["withdraw"]))){
       var contractAddress = parsedData["withdraw"][0]["contract"]
       if (contractAddress == 'terra1wh39swv7nq36pnefnupttm2nr96kz7jjddyt2x'){ 
        return true
       }

   }
return false
}
function isAnchorRepay(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
   if ( (exists (parsedData["repay_stable"]))){
       var contractAddress = parsedData["repay_stable"][0]["contract"]

       if (contractAddress == 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s'){ 
        return true
       }

   }


return false
}


function isAnchorBlunaMint(txData){
    var logs = txData["logs"]
    for (let li = 0; li < logs.length; li = li + 1) {
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        if (exists (parsedData)){ 
            if ( (exists (parsedData["mint"])) && (exists (parsedData["increase_balance"]) ) ){
                var contractAddress = parsedData["mint"][0]["contract"]

                if (contractAddress == 'terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts'){ 
                    return true
                }

            }
        }
    }

return false
}
function isTsLpRemove(txData){
    var logs = txData["logs"]
    for (let li = 0; li < logs.length; li = li + 1) {
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        if (exists (parsedData)){ 
            if ( (exists (parsedData["withdraw_liquidity"])) && (exists (parsedData["burn"]) ) ){
                //var contractAddress = parsedData["mint"][0]["contract"]
                return true

            }
        }
    }
    return false
}

function isTsSwap(txData){
    var logs = txData["logs"]
    for (let li = 0; li < logs.length; li = li + 1) {
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        if (exists (parsedData)){ 
            if ( (exists (parsedData["swap"]) && (exists (parsedData["mint"]) == false )) ){
                //var contractAddress = parsedData["swap"][0]["contract"]
                return true
            }
        }
    }

    return false
}
function isTsLpAdd(txData){

    var logs = txData["logs"]
    for (let li = 0; li < logs.length; li = li + 1) {
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        if (exists (parsedData)){ 
            if ( (exists (parsedData["provide_liquidity"])) && (exists (parsedData["mint"]) ) ){
                //var contractAddress = parsedData["swap"][0]["contract"]
                return true
            }
        }
    }




    return false
}

function isAnchorColateralDeposit(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    if ( (exists (parsedData["deposit_collateral"])) ){
        //var contractAddress = parsedData["swap"][0]["contract"]
        return true
    }
    return false
}

function isAnchorColateralWithdrawal(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    if ( (exists (parsedData["unlock_collateral"])) ){
        //var contractAddress = parsedData["swap"][0]["contract"]
        return true
    }
    return false
}

//determines if tx is an anchor mint
function isMirrorClaimRewards(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
   if ( (exists (parsedData["withdraw"])) && (exists (parsedData["transfer"]) ) ){
       var contractAddress = parsedData["withdraw"][0]["contract"]

       if (contractAddress == "terra17f7zu97865jmknk7p2glqvxzhduk78772ezac5"){ 
        return true
       }

   }


return false
}
function isAnchorLpClaimRewards(txData){
    var logs = txData["logs"]
    for (let li = 0; li < logs.length; li = li + 1) {
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        if (exists (parsedData)){ 
            if ( (exists (parsedData["withdraw"])) && (exists (parsedData["transfer"]) ) ){
                var contractAddress = parsedData["withdraw"][0]["contract"]

                if (contractAddress == "terra1897an2xux840p9lrh6py3ryankc6mspw49xse3"){ 
                    return true
                }

            }
        }
    }
return false
}
function isMineClaimRewards(txData){
    var logs = txData["logs"]
    for (let li = 0; li < logs.length; li = li + 1) {
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        if (exists (parsedData)){ 
            if ( (exists (parsedData["withdraw"])) && (exists (parsedData["transfer"]) ) ){
                var contractAddress = parsedData["withdraw"][0]["contract"]

                if (contractAddress == "terra19nek85kaqrvzlxygw20jhy08h3ryjf5kg4ep3l"){ 
                    return true
                }

            }
        }
    }

return false
}

function isAnchorBlunaClaimRewards(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
   if ( (exists (parsedData["claim_reward"]))  ){
       var contractAddress = parsedData["claim_reward"][0]["contract"]

       if (contractAddress == "terra17yap3mhph35pcwvhza38c2lkj7gzywzy05h7l0"){ 
        return true
       }

   }

return false
}
function isAnchorBorrowClaimRewards(txData){
    const parsedData = parseContractActions(txData["logs"][0]["events"])
   if ( (exists (parsedData["claim_rewards"])) && (exists (parsedData["transfer"]) ) ){
       var contractAddress = parsedData["claim_rewards"][0]["contract"]

       if (contractAddress == "terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s"){ 
        return true
       }

   }

return false
}


//determines if tx is an anchor mint
function isAnchorAustMint(txData){
    var logs = txData["logs"]
    for (let li = 0; li < logs.length; li = li + 1) {
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        if (exists (parsedData)){ 

            if ( (exists (parsedData["deposit_stable"])) ){
                var contractAddress = parsedData["mint"][0]["contract"]
                return true

            }
        }
    }

return false
}
//determines if anchor swap
function isAnchorAustRedeem(txData){
    var logs = txData["logs"]
    for (let li = 0; li < logs.length; li = li + 1) {
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        if (exists (parsedData)){ 

            if ( (exists (parsedData["redeem_stable"])) ){
                var contractAddress = parsedData["burn"][0]["contract"]
                return true
            }

        }
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
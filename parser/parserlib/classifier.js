import {checkTx,initLCD,getCW20Info } from './lcd.js'
import {parseContractActions,parseContractEvents,parseTransfer,parseNativeRewards,parseNativeDelegation } from './events.js'
import { TaxRateUpdateProposal } from '@terra-money/terra.js'
import _ from 'lodash'

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
    
    if(! exists (txData["logs"])) {
        return false;
    }
    
    //const txData =await checkTx(txId,60000,lcd)
        
    var txTypes = [
        { type: 'anchorBlunaClaimRewards', fnClassifier: isAnchorBlunaClaimRewards},
        { type: 'anchorBlunaBurn', fnClassifier: isAnchorBlunaBurn},
        { type: 'anchorBlunaMint', fnClassifier: isAnchorBlunaMint},
        { type: 'anchorBorrow', fnClassifier: isAnchorBorrow},
        { type: 'anchorBorrowClaimRewards', fnClassifier: isAnchorBorrowClaimRewards},
        { type: 'anchorColateralDeposit', fnClassifier: isAnchorColateralDeposit},
        { type: 'anchorColateralWithdrawal', fnClassifier: isAnchorColateralWithdrawal},
        { type: 'anchorLpClaimRewards', fnClassifier: isAnchorLpClaimRewards},
        { type: 'anchorMint', fnClassifier: isAnchorAustMint},
        { type: 'anchorRedeem', fnClassifier: isAnchorAustRedeem},
        { type: 'anchorRepay', fnClassifier: isAnchorRepay},
        { type: 'CW20SendReceive', fnClassifier: isCW20SendReceive},
        { type: 'govVote', fnClassifier: isGovVote},
        { type: 'isMirrorCloseCDP', fnClassifier: isMirrorCloseCDP},
        { type: 'mineClaimRewards', fnClassifier: isMineClaimRewards},
        { type: 'mirrorClaimRewards', fnClassifier: isMirrorClaimRewards},
        { type: 'mirrorCloseShortFarm', fnClassifier: isMirrorCloseShortFarm},
        { type: 'mirrorGovStake', fnClassifier: isMirrorGovStake},
        { type: 'mirrorGovUnstake', fnClassifier: isMirrorGovUnstake},
        { type: 'mirrorOpenCDP', fnClassifier: isMirrorOpenCDP},
        { type: 'mirrorOpenShortFarm', fnClassifier: isMirrorOpenShortFarm},
        { type: 'nativeDelegation', fnClassifier: isNativeDelegation},
        { type: 'nativeRewardsClaim', fnClassifier: isNativeRewards},
        { type: 'nativeSendReceive', fnClassifier: isNativeSendReceive},
        { type: 'tsLpAdd', fnClassifier: isTsLpAdd},
        { type: 'tsLpRemove', fnClassifier: isTsLpRemove},
        { type: 'tsSwap', fnClassifier: isTsSwap},
    ];
    
    return _.find(txTypes, (txType) => {
        try {
            return txType.fnClassifier.call(this, txData)
        } catch(error) {
            console.log(error)
        }
    }).type
    
}

function isCW20SendReceive(txData,lcd) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    if ( ! exists (parsedData["transfer"])) {
        return false
    } 
    
    if ( exists (parsedData["mint"])) {
        return false
    }
    
    if (exists (parsedData["withdraw"])) {
        return false
    }
        
    var contractAddress = txData["transfer"][0]["contract"]
        
    return !! (getCW20Info(contractAddress,lcd))
}

function isNativeSendReceive(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    return parseTransfer(parsedData)
}

function isGovVote(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    return (exists (parsedData["cast_vote"]))
}

function isNativeDelegation(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    return (parseNativeDelegation(parsedData).length > 0)
}

function isNativeRewards(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    return parseNativeRewards(parsedData)
}

function isAnchorBlunaBurn(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    if ( ! (exists (parsedData["burn"]))){
       return false;
    }
   
    var contractAddress = parsedData["burn"][0]["contract"]

    return (contractAddress == 'terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts')
}

function isAnchorBorrow(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    if ( ! (exists (parsedData["borrow_stable"]))){
       return false
    }
    
    var contractAddress = parsedData["borrow_stable"][0]["contract"]

    return (contractAddress == 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s')
}

function isMirrorOpenShortFarm(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])

    if ( ! exists(parsedData["open_position"]))
    {
        return false
    }
    
    if ( ! exists(parsedData["increase_short_token"]))
    {
        return false
    }
    
    var contractAddress = parsedData["open_position"][0]["contract"]

    return (contractAddress == 'terra1wfz7h3aqf4cjmjcvc6s8lxdhh7k30nkczyf0mj')
}

function isMirrorCloseShortFarm(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])

    if ( ! exists(parsedData["send"])){
        return false
    }
    
    if ( ! exists (parsedData["decrease_short_token"])){
        return false
    }
    
    var contractAddress = parsedData["send"][0]["to"]

    return (contractAddress == 'terra1wfz7h3aqf4cjmjcvc6s8lxdhh7k30nkczyf0mj')
}

function isMirrorOpenCDP(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
 
    if ( ! exists (parsedData["open_position"])) {
        return false
    }
    
    if ( ! exists (parsedData["increase_short_token"])) {
        return false
    }
    
    var contractAddress = parsedData["open_position"][0]["contract"]

    return (contractAddress == 'terra1wfz7h3aqf4cjmjcvc6s8lxdhh7k30nkczyf0mj')
}

function isMirrorCloseCDP(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    if ( ! exists(parsedData["burn"])){
        return false;
    }
    
    var contractAddress = parsedData["burn"][0]["contract"]

    return (contractAddress == 'terra1wfz7h3aqf4cjmjcvc6s8lxdhh7k30nkczyf0mj')
}

function isMirrorGovStake(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    if ( ! exists(parsedData["staking"])) {
        return false
    }
    
    var contractAddress = parsedData["staking"][0]["contract"]
    return (contractAddress == 'terra1wh39swv7nq36pnefnupttm2nr96kz7jjddyt2x')
}

function isMirrorGovUnstake(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    if ( ! exists (parsedData["withdraw"])) {
        return false
    }
    
    var contractAddress = parsedData["withdraw"][0]["contract"]
    
    return (contractAddress == 'terra1wh39swv7nq36pnefnupttm2nr96kz7jjddyt2x')
}

function isAnchorRepay(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    if ( ! exists (parsedData["repay_stable"])) {
       return false
    }
    
    var contractAddress = parsedData["repay_stable"][0]["contract"]

    return (contractAddress == 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s')
}


function isAnchorBlunaMint(txData) {
    
    var logs = txData["logs"]
    
    for (let li = 0; li < logs.length; li = li + 1) {
    
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        
        if ( ! exists (parsedData)){ 
            continue
        }
            
        if ( ! exists (parsedData["mint"])) {
            continue
        }
        
        if ( ! exists (parsedData["increase_balance"]) ) { 
            continue
        }
        
        var contractAddress = parsedData["mint"][0]["contract"]

        if (contractAddress == 'terra1mtwph2juhj0rvjz7dy92gvl6xvukaxu8rfv8ts'){ 
            return true
        }

    }

    return false
}


function isTsLpRemove(txData) {
    
    var logs = txData["logs"]
    
    for (let li = 0; li < logs.length; li = li + 1) {
        
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        
        if (! exists(parsedData)) { 
            continue
        }
        
        if (! exists(parsedData["withdraw_liquidity"])) {
            continue
        }
        
        if ( exists (parsedData["burn"])) {
            return true
        }
    }
    
    return false
}

function isTsSwap(txData) {
    
    var logs = txData["logs"]
    
    for (let li = 0; li < logs.length; li = li + 1) {
        
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        
        if (! exists (parsedData)) {
            continue 
        }
        
        if (! exists (parsedData["swap"])) {
            continue        
        } 
        
        if ( ! exists (parsedData["mint"])) {
            return true
        }
    }

    return false
}

function isTsLpAdd(txData) {

    var logs = txData["logs"]
    
    for (let li = 0; li < logs.length; li = li + 1) {
        
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        
        if ( ! exists (parsedData)) { 
            continue
        }
        
        if ( ! exists (parsedData["provide_liquidity"])) {
            continue
        }
        
        if ( exists (parsedData["mint"])){
            return true
        }
    }
}

function isAnchorColateralDeposit(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    return (exists (parsedData["deposit_collateral"]))
}

function isAnchorColateralWithdrawal(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    return (exists (parsedData["unlock_collateral"]))
}

//determines if tx is an anchor mint
function isMirrorClaimRewards(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    if ( ! exists (parsedData["withdraw"]) ){
        return false
    }
    
    if ( ! exists (parsedData["transfer"]) ) {
        return false
    }
    
    var contractAddress = parsedData["withdraw"][0]["contract"]

    return (contractAddress == "terra17f7zu97865jmknk7p2glqvxzhduk78772ezac5")
}

function isAnchorLpClaimRewards(txData) {
    
    var logs = txData["logs"]
    
    for (let li = 0; li < logs.length; li = li + 1) {
        
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        
        if (! exists (parsedData)) { 
            continue
        }
        
        if ( ! exists(parsedData["withdraw"])) {
            continue
        }
        
        if ( ! exists (parsedData["transfer"])) {
            continue
        }
        
        var contractAddress = parsedData["withdraw"][0]["contract"]

        if(contractAddress == "terra1897an2xux840p9lrh6py3ryankc6mspw49xse3") {
            return true
        }
    }
}

function isMineClaimRewards(txData) {
    
    var logs = txData["logs"]
    
    for (let li = 0; li < logs.length; li = li + 1) {
        
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        
        if ( ! exists (parsedData)) { 
            continue
        }
        
        if ( ! exists (parsedData["withdraw"])) {
            continue
            
        }
        
        if ( ! exists (parsedData["transfer"]) ) {
            continue
        }
        
        var contractAddress = parsedData["withdraw"][0]["contract"]

        if (contractAddress == "terra19nek85kaqrvzlxygw20jhy08h3ryjf5kg4ep3l"){ 
            return true
        }
    }

    return false
}

function isAnchorBlunaClaimRewards(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    if ( ! exists (parsedData["claim_reward"])) {
        return false
    }
    
    var contractAddress = parsedData["claim_reward"][0]["contract"]

    return (contractAddress == "terra17yap3mhph35pcwvhza38c2lkj7gzywzy05h7l0")
}

function isAnchorBorrowClaimRewards(txData) {
    
    const parsedData = parseContractActions(txData["logs"][0]["events"])
    
    if ( ! exists (parsedData["claim_rewards"])) {
       return false
    }
   
    if ( ! exists (parsedData["transfer"])) {
       return false
    }
    
    var contractAddress = parsedData["claim_rewards"][0]["contract"]

    return (contractAddress == "terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s")
}


//determines if tx is an anchor mint
function isAnchorAustMint(txData) {
    
    var logs = txData["logs"]
    
    for (let li = 0; li < logs.length; li = li + 1) {
        
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        
        if ( ! exists (parsedData)) { 
            continue
        }

        if ( (exists (parsedData["deposit_stable"])) ) {
            var contractAddress = parsedData["mint"][0]["contract"]
            return true
        }
    }

    return false
}

//determines if anchor swap
function isAnchorAustRedeem(txData) {
    
    var logs = txData["logs"]
    
    for (let li = 0; li < logs.length; li = li + 1) {
        
        var parsedData = parseContractActions(txData["logs"][li]["events"])
        
        if ( ! exists(parsedData)) { 
            continue
        }

        if ( (exists (parsedData["redeem_stable"])) ){
            var contractAddress = parsedData["burn"][0]["contract"]
            return true
        }
    }

    return false
}

function exists (input) {
    return (typeof input === 'undefined')
}
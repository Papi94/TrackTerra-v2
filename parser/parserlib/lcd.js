import { LCDClient, TxInfo, Wallet, Msg } from '@terra-money/terra.js'



export function initLCD(URL, chainID) {
    var lcd
  lcd = new LCDClient({ URL, chainID, gasPrices: { uusd: 0.15 } })
  return lcd
}

export async function checkTx(txHash, timeout = 60000,lcd) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeout) {
    const txInfo = await lcd.tx.txInfo(txHash).catch(() => undefined)

    if (txInfo) {
      return txInfo
    }

    await sleep(1000)
  }
}

export async function transaction(
  wallet,
  msgs,
  fee,
  accountNumber = undefined,
  sequence = undefined,
  timeout = 60000
  ,lcd
) {
  return wallet
    .createAndSignTx({ msgs, account_number: accountNumber, sequence, fee })
    .then((signed) => lcd.tx.broadcast(signed))
    .then(async (broadcastResult) => {
      if (broadcastResult['code']) {
        throw new Error(broadcastResult.raw_log)
      }
      return checkTx(broadcastResult.txhash, timeout)
    })
}

export async function contractInfo(address,lcd) {
  if (!address) {
    throw new Error('wrong address')
  }
  return (await lcd.wasm.contractInfo(address))
}

export async function getCW20Info(address,lcd )
{
  try {
    var response = await contractQuery(address , {"token_info":{}}, lcd)
  }catch{
    var response = false
  }
 return response
}

export async function contractQuery(
  address,
  query,
  lcd
){
  if (!address) {
    throw new Error('wrong address')
  }
  return await lcd.wasm.contractQuery(address, query)
}
export function sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
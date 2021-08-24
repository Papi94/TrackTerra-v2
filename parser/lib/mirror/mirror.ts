import { getContractStore } from 'lib/terra'
import { num } from 'lib/num'
import {
  PairPool, OraclePrice, GovConfig, GovPoll, MintAssetConfig, StakingPool, DistributionInfo
} from './types'

export async function getPairPool(pair: string):
  Promise<{assetAmount: string; collateralAmount: string; totalShare: string}> {
  const pool = await getContractStore<PairPool>(pair, { pool: {} })
  const token = pool.assets.find((asset) => asset.info['token'])
  const nativeToken = pool.assets.find((asset) => asset.info['nativeToken'])

  return {
    assetAmount: token?.amount || '0',
    collateralAmount: nativeToken?.amount || '0',
    totalShare: pool.totalShare || '0'
  }
}

export async function getPairPrice(pair: string): Promise<string> {
  const pool = await getPairPool(pair)
  const price = num(pool.collateralAmount).dividedBy(pool.assetAmount).toString()

  return num(price).isNaN() ? undefined : price
}

export async function getOraclePrice(oracle: string, token: string): Promise<string> {
  const oraclePrice = await getContractStore<OraclePrice>(
    oracle, { price: { baseAsset: token, quoteAsset: 'uusd' } }
  )

  if (!oraclePrice)
    return undefined

  return num(oraclePrice.rate).toString()
}

export async function getTokenBalance(token: string, address: string): Promise<string> {
  const { balance } = await getContractStore(token, { balance: { address } })

  return balance
}

export async function getStakingPool(staking: string, token: string): Promise<StakingPool> {
  return getContractStore(staking, { poolInfo: { assetToken: token } })
}

export async function getGovConfig(gov: string): Promise<GovConfig> {
  return getContractStore(gov, { config: {} })
}

export async function getGovPolls(gov: string, filter: string, limit: number): Promise<GovPoll[]> {
  const { polls } = await getContractStore(gov, { polls: { filter, limit } })

  return polls
}

export async function getMintAssetConfig(mint: string, token: string): Promise<MintAssetConfig> {
  return getContractStore(mint, { assetConfig: { assetToken: token } })
}

export async function getDistributionInfo(factory: string): Promise<DistributionInfo> {
  return getContractStore(factory, { distributionInfo: {} })
}

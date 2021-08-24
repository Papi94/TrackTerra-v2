import { ethers } from 'ethers'
import { num, BigNumber } from 'lib/num'
import { EthPoolInfo, EthPairInfo, EthAssetInfos } from 'types'
import { getProvider, getAssets } from './'
import * as abi from './abis/fetcher.json'

interface Dictionary<A> {
  [key: string]: A
}

type PairInfoData = [
  string, // pair lpToken
  ethers.BigNumber, // pair lpSupply
  string, // ust
  ethers.BigNumber, // ustReserve
  string, // asset
  string, // assetSymbol
  ethers.BigNumber // assetReserve
]

type PoolInfoData = [
  string, // lpToken
  ethers.BigNumber, // lpStaked
  ethers.BigNumber // rewardRemains
]

let fetcherContract: ethers.Contract

const dictWithFn = <T, Item>(obj: Dictionary<Item>, fn: (value: Item) => T) =>
  Object.entries(obj).reduce<Dictionary<T>>(
    (acc, [key, value]) => ({ ...acc, [key]: fn(value) }),
    {}
  )

export function getFetcherContract(): ethers.Contract {
  if (!fetcherContract) {
    fetcherContract = new ethers.Contract(
      process.env.TERRA_CHAIN_ID.includes('columbus')
        ? '0xF497145AD68ed6aDFA981c21e5bCdE949d0C3935'
        : '0xc08e82786a62f27382ebE0a518533Fb4Fd91dC81',
      abi,
      getProvider()
    )
  }

  return fetcherContract
}

function formatEthToTerra(number: ethers.BigNumber): string {
  return num(ethers.utils.formatEther(number)).multipliedBy(1000000).toFixed(0)
}

export async function queryPairInfo(): Promise<Dictionary<EthPairInfo>> {
  const tokens = Object.keys(getAssets())
  const pairInfo: PairInfoData[] = await getFetcherContract().fetchPairInfo(tokens)

  const parse = (item: PairInfoData) => {
    const [, $lpSupply, , ustReserve, , , assetReserve] = item

    const lpSupply = formatEthToTerra($lpSupply)
    const ust = formatEthToTerra(ustReserve)
    const asset = formatEthToTerra(assetReserve)
    const price = new BigNumber(ust).div(asset).toString()
    const total = new BigNumber(asset).times(price).plus(ust).toFixed(0)

    return { lpSupply, ust, asset, price, total }
  }

  return pairInfo.reduce<Dictionary<EthPairInfo>>(
    (acc, cur, index) => ({ ...acc, [tokens[index]]: parse(cur) }),
    {} as Dictionary<EthPairInfo>
  )
}

export async function queryPoolInfo(): Promise<Dictionary<EthPoolInfo>> {
  const assets = getAssets()
  const tokens = Object.keys(getAssets())
  const pools = tokens.map((token) => assets[token].pool)
  const poolInfo: PoolInfoData[] = await getFetcherContract().fetchPoolInfo(pools)

  const parse = (item: PoolInfoData) => {
    const [, lpStaked, rewardRemains] = item

    return {
      lpStaked: formatEthToTerra(lpStaked),
      rewardRemains: formatEthToTerra(rewardRemains),
    }
  }

  return poolInfo.reduce<Dictionary<EthPoolInfo>>(
    (acc, cur, index) => ({ ...acc, [tokens[index]]: parse(cur) }),
    {} as Dictionary<EthPoolInfo>
  )
}

/* 페어 정보와 풀 정보를 조합하여 APR 계산하기 */
export async function queryAssetInfos(): Promise<EthAssetInfos> {
  const assets = getAssets()
  const pairInfo = await queryPairInfo()
  const poolInfo = await queryPoolInfo()
  const mir = Object.keys(assets).find((token) => assets[token].symbol === 'MIR')

  const getInfo = (item) => {
    const { token } = item
    const { price: MIRPrice } = pairInfo[mir]
    const tokenPair = pairInfo[token]
    const tokenPool = poolInfo[token]
    const { total: liquidityValue, lpSupply: totalLpShare } = tokenPair
    const { lpStaked: stakedLpShare } = tokenPool

    /* apr */
    const MIRAnnualRewards = String(
      getMIRAnnualRewards(Date.now(), token === mir)
    )

    const apr = calcAPR(MIRAnnualRewards, MIRPrice, liquidityValue, stakedLpShare, totalLpShare)
    return { ...item, ...tokenPair, ...tokenPool, apr }
  }

  return dictWithFn(assets, getInfo)
}

function getMIRAnnualRewards(now = Date.now(), isMIR = false) {
  const GENESIS = 1607022000000
  const YEAR_TO_MILLISECONDS = 31556952000
  const rewards = [3431250, 1715625, 857813, 428906]
  const index = Math.max(0, Math.floor((now - GENESIS) / YEAR_TO_MILLISECONDS))
  const reward = rewards[index]
  return !reward ? undefined : isMIR ? reward * 3 : reward
}

function calcAPR(
  MIRAnnualRewards: string, MIRPrice: string, liquidityValue: string, stakedLpShare: string, totalLpShare: string
): string {
  const MIRAnnualRewardsValue = num(MIRAnnualRewards).times(1000000).times(MIRPrice)
  const stakedRatio = num(stakedLpShare).div(totalLpShare)

  const numerator = MIRAnnualRewardsValue
  const denominator = num(liquidityValue).times(stakedRatio)

  return (numerator.gt(0) && denominator.gt(0))
    ? numerator.div(denominator).toString()
    : "0"
}

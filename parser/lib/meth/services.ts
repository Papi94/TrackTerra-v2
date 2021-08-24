import { ethers } from 'ethers'
import * as bluebird from 'bluebird'
import { loadEthAssets } from 'lib/data'
import { num } from 'lib/num'
import { EthAssets } from 'types'
import { getDistibutorContractAddress, balanceOf } from './'

let assets: EthAssets

export function getAssets(): EthAssets {
  if (!assets) {
    assets = loadEthAssets()
  }

  return assets
}

export async function getMethMirTokenBalance(): Promise<string> {
  const assets = getAssets()
  const mirrorToken = Object.keys(assets).find((token) => assets[token].symbol === 'MIR')
  let balance = num(0)

  const distributorBalance = num(ethers.utils.formatEther(
    await balanceOf(mirrorToken, getDistibutorContractAddress())
  )).multipliedBy(1000000)

  balance = balance.plus(distributorBalance)

  await bluebird.map(Object.keys(assets), async (token) => {
    const poolBalance = num(ethers.utils.formatEther(
      await balanceOf(mirrorToken, assets[token].pool)
    )).multipliedBy(1000000)

    balance = balance.plus(poolBalance)
  })

  return balance.toFixed(0)
}

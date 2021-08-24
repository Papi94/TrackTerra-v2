import { ethers } from 'ethers'
import { getProvider } from './'
import * as abi from './abis/lpPool.json'

const contracts = {}

export function getLpPoolContract(lpContract: string): ethers.Contract {
  if (!contracts[lpContract]) {
    contracts[lpContract] = new ethers.Contract(lpContract, abi, getProvider())
  }

  return contracts[lpContract]
}

export async function balanceOfLpToken(lpContract: string, address: string): Promise<string> {
  const contract = getLpPoolContract(lpContract)
  if (!contract) {
    throw new Error(`undefined eth lpContract ${lpContract}`)
  }

  return contract.balanceOf(address)
}

import { ethers } from 'ethers'
import { getProvider } from './'
import * as abi from './abis/token.json'

const contracts = {}

export function getTokenContract(token: string): ethers.Contract {
  if (!contracts[token]) {
    contracts[token] = new ethers.Contract(token, abi, getProvider())
  }

  return contracts[token]
}

export async function balanceOf(token: string, address: string): Promise<string> {
  const contract = getTokenContract(token)
  if (!contract) {
    throw new Error(`undefined eth token contract ${token}`)
  }

  return contract.balanceOf(address)
}

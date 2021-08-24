import { ethers } from 'ethers'
import { getProvider } from './'

const distributorContractAddress = '0x2A398bBa1236890fb6e9698A698A393Bb8ee8674'
const abi = ['function isClaimed(uint256 index) public view returns (bool)']

let distributorContract: ethers.Contract

export function getDistibutorContractAddress(): string {
  return distributorContractAddress
}

export function getDistributorContract(): ethers.Contract {
  if (!distributorContract) {
    distributorContract = new ethers.Contract(distributorContractAddress, abi, getProvider())
  }

  return distributorContract
}

export async function isAirdropClaimed(index: string): Promise<boolean> {
  return getDistributorContract().isClaimed(index)
}

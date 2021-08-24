import { ethers } from 'ethers'

let provider: ethers.providers.BaseProvider

export function getProvider(): ethers.providers.BaseProvider {
  if (!provider) {
    provider = new ethers.providers.InfuraProvider(
      process.env.TERRA_CHAIN_ID.includes('columbus') ? 'homestead' :'ropsten',
      {
        projectId: process.env.INFURA_ID,
        projectSecret: process.env.INFURA_SECRET,
      }
    )
  }

  return provider
}

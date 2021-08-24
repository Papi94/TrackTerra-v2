export interface GovConfig {
  votingPeriod: number
  effectiveDelay: number
  expirationPeriod: number
  mirrorToken: string
  owner: string
  proposalDeposit: string
  quorum: string
  threshold: string
}

export interface GovPoll {
  creator: string
  depositAmount: string
  description: string
  endHeight: number
  executeData: unknown[]
  id: number
  link?: string
  noVotes: string
  status: string
  title: string
  yesVotes: string
}

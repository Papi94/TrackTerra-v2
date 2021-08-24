import { BigNumber } from 'bignumber.js'
import config from 'config'

BigNumber.config({
  DECIMAL_PLACES: config.DECIMALS,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
})

export function num(number: number | string): BigNumber {
  return new BigNumber(number)
}

export function aprToApy(apr: string): string {
  return !num(apr).isNaN() && apr !== '0'
    ? num(1).plus(num(apr).dividedBy(365)).pow(365).minus(1).toFixed(4)
    : '0'
}

export * from 'bignumber.js'

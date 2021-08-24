import { addHours, addDays, addMonths, addYears } from 'date-fns'
import { HistoryRanges } from 'types'

export function getHistoryRangeValues(
  timestamp: number,
  range: HistoryRanges
): { from: number; interval: number } {
  let from = 0
  let interval = 0

  if (range === HistoryRanges.ONE_HOUR) {
    from = addHours(timestamp, -1).getTime()
    interval = 1 // 1minute * 60
  } else if (range === HistoryRanges.ONE_DAY) {
    from = addDays(timestamp, -1).getTime()
    interval = 30 // 30minuntes * 48
  } else if (range === HistoryRanges.ONE_WEEK) {
    from = addDays(timestamp, -7).getTime()
    interval = 60 * 3 // 3hours * 56
  } else if (range === HistoryRanges.ONE_MONTH) {
    from = addMonths(timestamp, -1).getTime()
    interval = 60 * 12 // 12hours * 60
  } else if (range === HistoryRanges.ONE_YEAR) {
    from = addYears(timestamp, -1).getTime()
    interval = 60 * 24 * 10 // 10days * 36
  } else {
    throw new Error('wrong range')
  }

  return { from, interval }
}

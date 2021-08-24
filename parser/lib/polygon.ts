import nodeFetch from 'node-fetch'

const apiKey = process.env.POLYGON_API_KEY
const url = 'https://api.polygon.io'

export enum TimeSpan {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  QUARTER = 'quarter',
  YEAR = 'year',
}

interface AggregatesResponse {
  status: string
  ticker: string
  queryCount: number
  resultsCount: number
  adjusted: boolean
  results: {
    v: number // volume
    vw: number
    o: number // open
    c: number // close
    h: number // high
    l: number // low
    t: number // timestamp
    a: number
  }[]
}

interface OHLC {
  open: string
  high: string
  low: string
  close: string
  timestamp: number
}

export async function fetchAggregates(
  ticker: string,
  timespan: TimeSpan,
  from: number,
  to: number
): Promise<OHLC[]> {
  const response: AggregatesResponse = await nodeFetch(
    `${url}/v2/aggs/ticker/${ticker}/range/1/${timespan}/${from}/${to}?apiKey=${apiKey}`
  ).then((res) => res.json())

  if (response?.status !== 'OK') {
    throw new Error(response.status)
  }

  const dailyPrices = response?.results?.length
    ? response.results.map((result) => ({
        ticker,
        open: result.o.toString(),
        high: result.h.toString(),
        low: result.l.toString(),
        close: result.c.toString(),
        timestamp: result.t,
      }))
    : []

  return dailyPrices
}

import nodeFetch from 'node-fetch'
import { uniqBy } from 'lodash'

const apiKey = process.env.IEX_CLOUD_API_KEY
const url = 'https://cloud.iexapis.com/v1'

const whitelist = [
  'Seeking Alpha',
  'Investing.com',
  'Reuters',
  'The Wall Street Journal',
  'Benzinga',
  'MarketWatch',
  'Forbes News',
  'Yahoo Finance',
  'Investopedia',
  'Financial Times',
  'Nasdaq',
  'Bloomberg',
]

interface News {
  datetime: Date
  headline: string
  source: string
  url: string
  summary: string
}

export async function fetchNews(ticker: string, from: number, limit = 100): Promise<News[]> {
  const response = await nodeFetch(
    `${url}/stock/${ticker}/news/last/${limit}?token=${apiKey}`
  ).then((res) => res.json())
  const since = new Date('2020-06-01').getTime()

  return uniqBy(
    response
      .filter(
        (news) =>
          news.lang === 'en' &&
          news.datetime > from &&
          news.datetime > since &&
          whitelist.includes(news.source)
      )
      .map((news) => ({
        datetime: new Date(news.datetime),
        headline: news.headline,
        source: news.source,
        url: news.url,
        summary: news.summary,
      })),
    (news) => news.datetime + news.source
  )
}

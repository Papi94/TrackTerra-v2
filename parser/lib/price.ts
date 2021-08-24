import { Repository } from 'typeorm'
import { AssetOHLC, PriceAt } from 'graphql/schema'

export async function getOHLC<T>(
  repo: Repository<T>,
  token: string,
  from: number,
  to: number
): Promise<AssetOHLC> {
  const ohlc = await repo
    .createQueryBuilder()
    .select('(array_agg(open ORDER BY datetime ASC))[1]', 'open')
    .addSelect('MAX(high)', 'high')
    .addSelect('MIN(low)', 'low')
    .addSelect('(array_agg(close ORDER BY datetime DESC))[1]', 'close')
    .where('token = :token', { token })
    .andWhere(
      'datetime BETWEEN to_timestamp(:from) AND to_timestamp(:to)',
      { from: Math.floor(from / 1000), to: Math.floor(to / 1000) }
    )
    .getRawOne()

  return new AssetOHLC({ ...ohlc, from, to })
}

export async function getHistory<T>(
  repo: Repository<T>,
  token: string | string[],
  from: number,
  to: number,
  interval: number
): Promise<PriceAt[]> {
  return repo
    .createQueryBuilder()
    .select('token')
    .addSelect('datetime', 'timestamp')
    .addSelect('close', 'price')
    .where(Array.isArray(token) ? 'token = ANY(:token)' : 'token = :token', { token })
    .andWhere(
      'datetime BETWEEN to_timestamp(:from) AND to_timestamp(:to)',
      { from: Math.floor(from / 1000), to: Math.floor(to / 1000) }
    )
    .andWhere("int4(date_part('minute', datetime)) % :interval = 0", { interval })
    .orderBy('datetime', 'ASC')
    .getRawMany()
}

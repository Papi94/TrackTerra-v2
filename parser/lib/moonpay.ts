import nodeFetch from 'node-fetch'

const url = 'https://api.moonpay.io'
const apiKey = process.env.MOONPAY_API_KEY

export async function history(transactionId: string, limit = 1): Promise<unknown> {
  if (!apiKey) return

  return nodeFetch(
    `${url}/v1/transactions/?externalTransactionId=${transactionId}&limit=${limit}`,
    { headers: { Authorization: `Api-Key ${apiKey}` } }
  ).then((res) => res.json())
}

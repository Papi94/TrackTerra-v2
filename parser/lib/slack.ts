import nodeFetch, { Response } from 'node-fetch'

export function sendSlack(username: string, text: string): Promise<Response> {
  if (!process.env.SLACK_URL || process.env.SLACK_URL === 'none' || !process.env.SLACK_CHANNEL) {
    return
  }

  return nodeFetch(process.env.SLACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: process.env.SLACK_CHANNEL,
      username,
      text,
    }),
  })
}

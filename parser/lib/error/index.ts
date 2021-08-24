import * as sentry from '@sentry/node'
import * as logger from 'lib/logger'

export function init(
  opts: {
    sentryDsn?: string
  } = undefined
): void {
  opts?.sentryDsn &&
    sentry.init({
      dsn: opts.sentryDsn,
      environment: process.env.TERRA_CHAIN_ID,
      maxBreadcrumbs: 500,
    })

  process.on('unhandledRejection', (error) => {
    logger.error(error)

    sentry.withScope((scope) => {
      scope.setLevel(sentry.Severity.Critical)
      sentry.captureException(error)
    })
  })
}

export function errorHandler(error?: Error): void {
  if (error) {
    logger.error(error)
    sentry.captureException(error)
  }
}

export * from './api'

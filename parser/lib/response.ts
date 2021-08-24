import { Context } from 'koa'
import { HttpStatusCodes } from 'lib/error'

export function success(ctx: Context, body = null): void {
  ctx.status = 200

  ctx.body = body === null ? JSON.stringify(body) : body
}

export function error(ctx: Context, type: string, code = undefined, message = undefined): void {
  ctx.status = HttpStatusCodes[type] || 500

  ctx.body = {
    type,
    code,
    message,
  }
}

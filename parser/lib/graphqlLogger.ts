import { ApolloServerPlugin } from 'apollo-server-plugin-base'
import { GraphQLRequestContext } from 'apollo-server-types'
import { GraphQLRequestListener } from 'apollo-server-plugin-base/src/index'
import { OperationDefinitionNode } from 'graphql'
import { get } from 'lodash'
import * as logger from 'lib/logger'

function operationToLog(operation: OperationDefinitionNode): string {
  return (operation.selectionSet?.selections || [])
    .map((selection) => get(selection, 'name.value'))
    .filter(Boolean)
    .join(',')
}

// https://stackoverflow.com/questions/59988906/how-do-i-write-a-apollo-server-plugin-to-log-the-request-and-its-duration
export const GraphQLLogger: ApolloServerPlugin  = {
  requestDidStart<TContext>(_: GraphQLRequestContext<TContext>): GraphQLRequestListener<TContext> {
    const start = Date.now()

    return {
      didResolveOperation(context) {
        if (context.operationName === 'IntrospectionQuery') {
          return
        }

        const { operation, queryHash } = context

        const variables = context.request?.variables
          ? `: ${JSON.stringify(context.request?.variables)}`
          : ''

        logger.info(`${queryHash.substr(-6)} ${operation?.operation} ${operationToLog(operation)}${variables}`)
      },

      didEncounterErrors(context) {
        const { operation, queryHash, errors } = context

        logger.info(`${queryHash.substr(-6)} ${operation?.operation} error: ${JSON.stringify(errors)}`)
      },

      willSendResponse(context) {
        if (context.operationName === 'IntrospectionQuery') {
          return
        }

        const { operation, queryHash } = context

        const elapsed = Date.now() - start
        const size = JSON.stringify(context.response).length * 2

        logger.info(`${queryHash.substr(-6)} ${operation?.operation} response: duration=${elapsed}ms bytes=${size}`)
      }
    }
  },
}

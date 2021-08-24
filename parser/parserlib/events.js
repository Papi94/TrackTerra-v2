//import { Event, EventKV, Coins } from '@terra-money/terra.js'
//import { isMatch, camelCase } from 'lodash'

import terrajs from '@terra-money/terra.js';
const { Event, EventKV, Coins } = terrajs;

import pkg from 'lodash';
const { isMatch, camelCase } = pkg;
const ContractActions = []
/*


  
  
  class ExecuteContract {
    sender
    contract
  }
  
  class ContractAction {
    actionType
  }
  
 class ContractEvent {
    address
    sender
    action
  }
  

  */

export function findAttributes(events, type, attribute) {
  if (attribute) {
    for (const event of events) {
      if (event.type === type) {
        for (const attr of event.attributes) {
          if (attr.key === attribute.key && attr.value === attribute.value) {
            return event.attributes
          }
        }
      }
    }
    return undefined
  }

  return events.find((event) => event.type === type)?.attributes
}

export function findAttribute(attributes, key) {
  return attributes.find((attr) => attr.key === key)?.value
}

export function parseContractActions(events) {
  const attributes = findAttributes(events, 'from_contract')
  if (!attributes) {
    return
  }

  const contractActions = []
  let contract

  for (let i = 0; i < attributes.length; i += 1) {
    const attr = attributes[i]
    if (attr.key === 'contract_address') {
      contract = attr.value
      continue
    }

    if (attr.key === 'action') {
      const action = attr.value
      const values = { contract }

      for (i = i + 1; i < attributes.length; i += 1) {
        const attr = attributes[i]

        if (attr.key === 'contract_address' || attr.key === 'action') {
          i = i - 1
          break
        }

        values[attr.key] = attr.value
      }

      contractActions[action] = contractActions[action] || []
      contractActions[action].push(values)
    }
  }

  return contractActions
}

export function parseTransfer(events) {
  const attributes = findAttributes(events, 'transfer')
  if (!attributes) {
    return false
  }

  const transfers = []

  for (let i = 0; i < attributes.length / 3; i += 1) {
    const to = attributes[i * 3].value
    const from = attributes[i * 3 + 1].value
    const value = attributes[i * 3 + 2].value

    if (!value || value.length < 1 || value === '0') {
      continue
    }

    const coins = Coins.fromString(value)
    coins.map((coin) => {
      const { denom, amount } = coin.toData()

      amount !== '0' && transfers.push({ from, to, denom, amount })
    })
  }

  return transfers
}

export function parseExecuteContracts(events) {
  const attributes = findAttributes(events, 'execute_contract')
  if (!attributes) {
    return
  }

  const executeContracts = []

  for (let i = 0; i < attributes.length / 2; i += 1) {
    const sender = attributes[i * 2].value
    const contractAddress = attributes[i * 2 + 1].value

    executeContracts.push({ sender, contractAddress })
  }

  // note: execute_contract log is in reverse order.
  return executeContracts.reverse()
}

export function parseNativeRewards(events) {
    const attributes = findAttributes(events, 'withdraw_rewards')
    if (!attributes) {
      return false
    }
  
    const returnResults = []
  
    for (let i = 0; i < attributes.length / 2; i += 1) {
      const amount = attributes[i * 2].value
      const validatorAddress = attributes[i * 2 + 1].value
  
      returnResults.push({ amount, validatorAddress })
    }
  
    return returnResults
  }

  export function parseNativeDelegation(events) {
    const attributes = findAttributes(events, 'delegate')
    if (!attributes) {
      return false
    }
  
    const returnResults = []
  
    for (let i = 0; i < attributes.length / 2; i += 1) {
      const validatorAddress = attributes[i * 2].value
      const amount = attributes[i * 2 + 1].value
  
      returnResults.push({ amount, validatorAddress })
    }
  
    
    return returnResults
  }




export function parseContractEvents(events) {
  const executeContracts = parseExecuteContracts(events)
  const attributes = findAttributes(events, 'from_contract')
  if (!Array.isArray(executeContracts) || !Array.isArray(attributes)) {
    return
  }

  const contractEvents = []
  let event = {
    address: undefined,
    sender: undefined,
    action: undefined,
  }

  for (let i = 0; i < attributes.length; i += 1) {
    const attr = attributes[i]
    if (attr.key === 'contract_address') {
      event = {
        address: attr.value,
        sender: executeContracts[contractEvents.length].sender,
        action: undefined,
      }

      contractEvents.push(event)
      continue
    }

    if (attr.key === 'action') {
      event.action = { actionType: attr.value }

      for (i = i + 1; i < attributes.length; i += 1) {
        const attr = attributes[i]

        if (attr.key === 'contract_address') {
          i = i - 1
          break
        }

        event.action[camelCase(attr.key)] = attr.value
      }
    } else {
      event[camelCase(attr.key)] = attr.value
    }
  }

  return contractEvents
}

export function findContractAction(
  contractEvents, address, action
) {
  return contractEvents.find(
    (event) => (event.address === address && event.action && isMatch(event.action, action))
  )
}

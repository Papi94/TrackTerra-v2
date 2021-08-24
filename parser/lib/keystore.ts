import * as fs from 'fs'
import * as promptly from 'promptly'
import { MnemonicKey, RawKey, Key } from '@terra-money/terra.js'
import * as crypto from './crypto'
import * as logger from 'lib/logger'

export function loadKeys(path: string): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8') || '{}')
  } catch (e) {
    logger.error('loadKeys', e.message)
    return {}
  }
}

export function getKey(path: string, key: string, password: string): Key {
  const keys = loadKeys(path)

  if (!keys[key]) {
    throw new Error('Cannot find key')
  }

  try {
    return new RawKey(Buffer.from(crypto.decrypt(keys[key], password), 'hex'))
  } catch (err) {
    throw new Error('Incorrect password')
  }
}

export function importKey(path: string, key: string, value: string, password: string): void {
  const keys = loadKeys(path)

  keys[key] = crypto.encrypt(value, password)

  fs.writeFileSync(path, JSON.stringify(keys))
}

export async function updateKey(path: string, key: string): Promise<void> {
  const password = await promptly.password('Enter a passphrase to encrypt your key to disk:', {
    replace: '*',
  })
  const confirm = await promptly.password('Repeat the passphrase:', { replace: '*' })

  if (password.length < 8) {
    logger.error('ERROR: password must be at least 8 characters')
    return
  }

  if (password !== confirm) {
    logger.error(`ERROR: passphrases don't matchPassword confirm failed`)
    return
  }

  const mnemonic = await promptly.prompt('Enter your bip39 mnemonic: ')

  if (mnemonic.trim().split(' ').length !== 24) {
    logger.error('Error: Mnemonic is not valid.')
    return
  }

  importKey(path, key, new MnemonicKey({ mnemonic }).privateKey.toString('hex'), password)
  logger.info('saved!')
}

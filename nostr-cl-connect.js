#!/usr/bin/env node

const crypto = require('crypto').webcrypto
const NostrEmitter = require('nostr-emitter')
const Plugin = require('clightningjs')

const DEFAULT_RELAYURL = 'nostr-relay.wlvs.space'
const DEFAULT_SECRET   = getRandomHex()

const nostrGateway = new Plugin()

nostrGateway.emitter = new NostrEmitter()

const notifications = [
  'channel_opened',
  'channel_open_failed',
  'channel_state_changed',
  'connect',
  'disconnect',
  'invoice_payment',
  'invoice_creation',
  'warning',
  'forward_event',
  'sendpay_success',
  'sendpay_failure',
  'coin_movement',
  'balance_snapshot',
  'openchannel_peer_sigs',
  'shutdown',
]

const hooks = [
  'peer_connected',
  'commitment_revocation',
  'db_write',
  'openchannel',
  'openchannel2',
  'htlc_accepted',
  'custommsg',
  'onion_message_blinded',
  'onion_message_ourpath'
]

function getRandomHex(size=16) {
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  return Buffer.from(bytes).toString('hex')
}

function registerListeners() {
  nostrGateway.emitter.on('call', async data => {
    const [ method, params = [] ] = data
    nostrGateway.log(`Received ${method} event with params: ${JSON.stringify(params)}`)
    if (nostrGateway?.rpc?.call) {  
      const response = await nostrGateway.rpc.call(method, params)
      nostrGateway.emitter.emit('response', [method, response])
    }
  })
}

for (let eventName of notifications) {
  nostrGateway.subscribe(eventName)
  nostrGateway.notifications[eventName].on(eventName, params => {
    nostrGateway.emitter.emit(eventName, params)
  })
}

for (let hookName of hooks) {
  nostrGateway.addHook(hookName, params => {
    nostrGateway.emitter.emit(hookName, params)
    return {'result': 'continue'}
  })
}

nostrGateway.onInit = async params => {
  const relayUrl = nostrGateway.options['relayUrl'].value
  const secretKey = nostrGateway.options['secretKey'].value

  const connectString = Buffer.from(`${relayUrl}:${secretKey}`).toString('base64url')
  const message = `Paste this connection string into your web app:\n\n${connectString}\n`

  nostrGateway.emitter.log = (msg) => nostrGateway.log(msg)
  registerListeners(nostrGateway)

  nostrGateway.emitter.connect('wss://' + relayUrl, secretKey)
  nostrGateway.log(message)
  return {'result': message }
}

nostrGateway.addOption('relayUrl', DEFAULT_RELAYURL, 'The url of the realy to connect with.')
nostrGateway.addOption('secretKey', DEFAULT_SECRET, 'The secret used to connect with e2e encryption.')

nostrGateway.start()

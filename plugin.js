#!/usr/bin/env node

const crypto = require('crypto').webcrypto
const NostrEmitter = require('nostr-emitter')
const Plugin = require('clightningjs')

const DEFAULT_RELAYURL = 'nostr-relay.wlvs.space'
const DEFAULT_SECRET   = getRandomBase64()

const nostrGateway = new Plugin()

nostrGateway.emitter = new NostrEmitter()
nostrGateway.emitter.log = nostrGateway.log

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
  'commitment_revocation',
  'db_write',
]

function getRandomBase64(size=16) {
  const bytes = crypto.getRandomValues(new Uint8Array(size))
  return Buffer.from(bytes).toString('base64')
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

  nostrGateway.emitter.on('getinfo', async () => {
    if (nostrGateway?.rpc?.call) {
      const response = await nostrGateway.rpc.call('getinfo')
      nostrGateway.emitter.emit('nodeinfo', {
        balance: response.fees_collected_msat,
        blockct: response.blockheight,
        chain: response.network
      })
    }
  })
}

for (let eventName of notifications) {
  nostrGateway.subscribe(eventName)
  nostrGateway.notifications[eventName].on(eventName, params => {
    nostrGateway.emitter.emit(eventName, params)
    return true
  })
}

for (let hookName of hooks) {
  nostrGateway.addHook(hookName, params => {
    nostrGateway.emitter.emit(hookName, params)
    return {'result': 'continue'}
  })
}

nostrGateway.onInit = async params => {
  nostrGateway.log('test')

  const relayUrl = DEFAULT_RELAYURL //nostrGateway.options['relayUrl'].value
  const secret   = DEFAULT_SECRET //nostrGateway.options['secret'].value

  const connectString = Buffer.from(`${relayUrl}:${secret}`).toString('base64url')
  const message = `Paste this connection string into your web app:\n\n${connectString}\n`

  registerListeners(nostrGateway)

  nostrGateway.emitter.connect('wss://' + relayUrl, secret)

  nostrGateway.log(message)
}

nostrGateway.addOption('relayUrl', DEFAULT_RELAYURL, 'The url of the realy to connect with.')
nostrGateway.addOption('secret', DEFAULT_SECRET, 'The secret used to connect with e2e encryption.')

nostrGateway.start()
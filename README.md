# nostr-cl-connect
Magically connect to your core lightning node using Nostr.

## How to Use
```bash
## Clone this repo into your plugin folder.
cd ~/.lightning/plugins
git clone <this repo url>

## Enter the folder and install dependencies.
cd nostr-cl-connect
yarn install || npm install

## Add these configurations to your lightning config file.
plugin=~/.lightning/plugins/nostr-cl-connect
relayUrl=<domain name your nostr relay, minus the wss://>
secretKey=<secret key used to encrypt/tag your traffic>
```

## Connecting a Client
Simply install / import the `nostr-emitter` library into your project, and setup a `NostrEmitter` using the same relay and secret key as configured in your plugin. For more information, see https://github.com/cmdruid/nostr-emitter

## Event API
```js
/* Use this event to make any RPC call. You will receive 
 * a 'response' event with a data object. 
 */

emitter.emit('call', [ 
  methodName,  // The name of the RPC call (as a string).
  methodArgs   // A string, array of strings, or null.
])

emitter.on('response', (
  eventParams, // The response object from your node.
  metaData     // Metadata about the nostr event.
) => {
  // Your function logic goes here.
})

/* Subscribe to any events from your lightning node. */
emitter.on('eventName', (
  eventParams, // The response object from your node.
  metaData     // Metadata about the nostr event.
) => {
  // Your function logic goes here.
})

/* List of subscribed events. */
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
```

## Contributions
Feel free to contribute!

## Thanks
Special thanks to [@niftynei](https://github.com/niftynei) for helping to squash a silly bug.

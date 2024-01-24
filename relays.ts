// Module for logic around all MEV relays.

const relays = [
  "ultrasound",
  "agnostic",
  "flashbots",
  "blxr-max-profit",
  "blxr-regulated",
  "blocknative",
  "eden",
  "aestus",
  "manifold",
];

export type Relay = (typeof relays)[number];

export const relayUrls: Record<Relay, string> = {
  ultrasound: "https://relay.ultrasound.money",
  agnostic: "https://agnostic-relay.net",
  flashbots: "https://boost-relay.flashbots.net",
  "blxr-max-profit": "https://bloxroute.max-profit.blxrbdn.com",
  "blxr-regulated": "https://bloxroute.regulated.blxrbdn.com",
  blocknative: "https://builder-relay-mainnet.blocknative.com",
  eden: "https://relay.edennetwork.io",
  aestus: "https://mainnet.aestus.live",
  manifold: "https://mainnet-relay.securerpc.com",
};

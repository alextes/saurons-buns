import * as Relays from "./relays";

for (const relayUrl of Object.values(Relays.relayUrls)) {
  const response = await fetch(
    `${relayUrl}/relay/v1/data/validator_registration?pubkey=0x8437a0f67aad7c5858469e812472ea2442117adf7fb2acb613e6d74b2288bcec7123805dbd28e2f424ccf83234b5ada8`,
  );

  console.log(await response.json());
}

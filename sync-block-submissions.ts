import postgres from "postgres";
import * as Log from "./log";
import * as RelayDb from "./relay-db";
import * as MevDb from "./mev-db";

// const syncProgressKey = "sync-block-submissions-progress";
// type SyncProgress = {
//   highestSlot: number;
//   lowestSlot: number;
// };

// const getSyncProgress = async (): Promise<SyncProgress | undefined> => {
//   const result = await mevSql`
//     SELECT value FROM key_value_store
//     WHERE key = ${syncProgressKey}
//   `;
//   if (result.length > 0) {
//     return result[0].value;
//   } else {
//     return undefined;
//   }
// };

// const setSyncProgress = async (progress: SyncProgress) =>
//   mevSql`
//     INSERT INTO key_value_store (key, value)
//     VALUES (
//       ${syncProgressKey},
//       ${JSON.stringify(progress)}
//     )
//     ON CONFLICT (key) DO UPDATE SET
//       value = ${JSON.stringify(progress)}
//   `;

const highestRelayDbSlot = await RelayDb.getHighestSubmittedSlot();
// Start from the highest slot and work backwards through time.
// Start with the highest - 1 to avoid storing half of an in-progress slot.
let highestSlot = highestRelayDbSlot - 1;

while (true) {
  const rows = await RelayDb.getBlockSubmissions(highestSlot);

  if (rows.length === 0) {
    Log.debug("no more rows to sync, exiting");
    break;
  }

  const plainRows = rows.map((row) => ({ ...row }));

  Log.debug("retrieved block submissions from relay DB", {
    count: plainRows.length,
  });

  console.log(plainRows);

  await MevDb.insertBlockSubmissions(plainRows);

  const lastRow = rows[rows.length - 1];
  highestSlot = lastRow.slot - 1;
}

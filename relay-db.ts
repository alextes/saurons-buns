import postgres from "postgres";
import { envConfig } from "./env.js";
import { getSubmissionsTable } from "./tables.js";

const relaySql = postgres({
  host: process.env.RELAY_PGHOST,
  database: "defaultdb",
  user: "postgres",
  password: process.env.RELAY_PGPASSWORD,
  port: Number(process.env.RELAY_PGPORT),
});

const submissionsTable = getSubmissionsTable(relaySql, envConfig.network);

export const getHighestSubmittedSlot = async (): Promise<number> => {
  const result = await relaySql<{ slot: number }[]>`
    SELECT slot FROM ${submissionsTable}
    ORDER BY slot DESC
    LIMIT 1
  `;

  if (result.length === 0) {
    throw new Error("No submissions found in relay DB, cannot sync");
  }

  return result[0].slot;
};

export const getBlockSubmissions = (highestSlot: number) =>
  relaySql`
    SELECT * FROM ${submissionsTable}
    WHERE slot <= ${highestSlot}
    ORDER BY slot DESC
    LIMIT 1000
  `;

export const getAvailableBlockSubmissionSlots = (): Promise<number[]> =>
  relaySql<{ slot: number }[]>`
    SELECT slot FROM ${submissionsTable}
  `.then((rows) => rows.map((row) => row.slot));

import type { Sql } from "postgres";

export const submissionsTablePart = "builder_block_submission";

export const getSubmissionsTable = (sql: Sql, network: string) =>
  sql(`${network}_${submissionsTablePart}`);

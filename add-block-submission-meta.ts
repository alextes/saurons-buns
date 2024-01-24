process.env.TZ = "UTC";

import * as DateFns from "date-fns";
import * as Env from "./env.js";
import * as RelayDb from "./relay-db.js";
import * as Log from "./log.js";
import * as fflate from "fflate";
import { ListObjectsV2CommandOutput, S3 } from "@aws-sdk/client-s3";

const getBucket = () => {
  if (Env.envConfig.env === "dev") {
    return "block-submission-archive-dev";
  } else if (Env.envConfig.env === "prod") {
    return "block-submission-archive";
  } else if (Env.envConfig.env === "stag") {
    return "block-submission-archive-stag";
  } else {
    throw new Error(`unknown env ${Env.envConfig.env}`);
  }
};

const bucket = getBucket();

const s3 = new S3({
  region: "gra",
  endpoint: Env.getEnvStrUnsafe("AWS_ENDPOINT"),
  credentials: {
    accessKeyId: Env.getEnvStrUnsafe("AWS_ACCESS_KEY_ID"),
    secretAccessKey: Env.getEnvStrUnsafe("AWS_SECRET_ACCESS_KEY"),
  },
});

const SECONDS_PER_SLOT = 12;

const getGenesisTimestamp = (): Date => {
  if (Env.envConfig.network === "mainnet") {
    return DateFns.parseISO("2020-12-01T12:00:23Z");
  } else if (Env.envConfig.network === "goerli") {
    return DateFns.parseISO("2021-03-23T14:00:00Z");
  } else {
    throw new Error(`unknown network ${Env.envConfig.network}`);
  }
};

const partialPathFromSlot = (slot: number) => {
  let seconds = slot * SECONDS_PER_SLOT;
  const dateTime = DateFns.addSeconds(getGenesisTimestamp(), seconds);
  const year = DateFns.format(dateTime, "yyyy");
  const month = DateFns.format(dateTime, "LL");
  const day = DateFns.format(dateTime, "dd");
  const hour = DateFns.format(dateTime, "HH");
  const minute = DateFns.format(dateTime, "mm");
  const key = `${year}/${month}/${day}/${hour}/${minute}/${slot}/`;

  Log.debug("converted slot to partial s3 path", { slot, key });

  return key;
};

async function* listObjectsForSlot(slot: number) {
  let isTruncated = true;
  let marker;
  const prefix = partialPathFromSlot(slot);

  while (isTruncated) {
    const result: ListObjectsV2CommandOutput = await s3.listObjectsV2({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: marker,
    });

    Log.debug("got list of objects", {
      count: result.Contents?.length,
      slot,
      truncated: result.IsTruncated,
    });

    if (result.Contents) {
      for (const item of result.Contents) {
        yield item;
      }
    }

    isTruncated = result.IsTruncated ?? false;
    if (isTruncated) {
      marker = result.NextContinuationToken;
    }
  }
}

for await (const objectMeta of listObjectsForSlot(6638290)) {
  Log.debug("got object meta", { key: objectMeta.Key });
  const object = await s3.getObject({
    Bucket: bucket,
    Key: objectMeta.Key,
  });
  Log.debug("got object", { key: objectMeta.Key });
  if (object.Body) {
    Log.debug("object body was not null");
    const body = await object.Body.transformToString();
    Log.debug("transformed object to byte array");
    const encoder = new TextEncoder();
    const utf8_bytes = fflate.gunzipSync(encoder.encode(body));
    Log.debug("unzipped object");
    const utf8 = new TextDecoder().decode(utf8_bytes);
    Log.debug("decoded object");
    const obj = JSON.parse(utf8);
    Log.debug("parsed object");
    console.log(obj);
  } else {
    Log.debug("object body was null");
  }
}

// console.log(
//   await s3.getObject({
//     Bucket: bucket,
//     Key: partialPathFromSlot(6401369),
//   }),
// );

const slots = await RelayDb.getAvailableBlockSubmissionSlots();

Log.debug("got slots", { slots });

// for (const slot of slots) {
// }

Log.debug("done");

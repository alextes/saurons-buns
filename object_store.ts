import * as Log from "./log";
import * as Env from "./env";
import * as AWS from "@aws-sdk/client-s3";

const objectStore = new AWS.S3({
  region: "gra",
  endpoint: Env.envConfig.s3Endpoint,
  credentials: {
    accessKeyId: Env.envConfig.s3AccessKey,
    secretAccessKey: Env.envConfig.s3SecretKey,
  },
});

const objects = await objectStore.listObjectsV2({
  Bucket: Env.envConfig.s3Bucket,
  Prefix: "2023/10/02/21/33/7454864",
});

for (const objectMeta of objects.Contents ?? []) {
  Log.debug("got object meta", { key: objectMeta.Key });
  const object = await objectStore.getObject({
    Bucket: Env.envConfig.s3Bucket,
    Key: objectMeta.Key,
  });
  Log.debug("got object", { key: objectMeta.Key });
  if (object.Body) {
    const response = new Response(object.Body.transformToWebStream());
    Log.debug("object body was not null");
    const body = await response.arrayBuffer();
    Log.debug("transformed object to array buffer");
    const bodyBytes = new Uint8Array(body);
    const utf8Bytes = Bun.gunzipSync(bodyBytes);
    Log.debug("unzipped object");
    const utf8 = new TextDecoder().decode(utf8Bytes);
    Log.debug("decoded object");
    const obj = JSON.parse(utf8);
    Log.debug("parsed object");
    console.log(obj.payload.execution_payload.block_hash);
  } else {
    Log.debug("object body was null");
  }
}

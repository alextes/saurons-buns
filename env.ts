export const getEnvBool = (name: string) => {
  if (process.env[name] === undefined) {
    return false;
  }
  return (
    process.env[name] === "true" ||
    process.env[name] === "1" ||
    process.env[name] === "TRUE"
  );
};

export const getEnvStr = (name: string): string | undefined =>
  process.env[name];

export const getEnvStrUnsafe = (name: string): string => {
  const value = getEnvStr(name);
  if (value === undefined) {
    throw new Error(`missing env var ${name}`);
  }
  return value;
};

type Network = "goerli" | "mainnet";

type EnvConfig = {
  env: Env;
  network: Network;
  s3AccessKey: string;
  s3Bucket: string;
  s3Endpoint: string;
  s3Region: string;
  s3SecretKey: string;
};

type Env = "dev" | "prod" | "stag";

export const envConfig: EnvConfig = {
  env: (getEnvStr("ENV") as Env) ?? "dev",
  network: (getEnvStr("NETWORK") as Network | undefined) ?? "mainnet",
  s3AccessKey: getEnvStrUnsafe("AWS_ACCESS_KEY_ID"),
  s3Bucket: getEnvStrUnsafe("S3_BUCKET"),
  s3Endpoint: getEnvStrUnsafe("AWS_ENDPOINT"),
  s3Region: getEnvStrUnsafe("AWS_DEFAULT_REGION"),
  s3SecretKey: getEnvStrUnsafe("AWS_SECRET_ACCESS_KEY"),
};

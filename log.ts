// Module responsible for handling logging in an ergonomic way. Supports
// logging to JSON, otherwise uses logfmt.
import kleur from "kleur";
import { getEnvBool } from "./env.js";

const LOG_LEVEL = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "ALERT"] as const;
type LogLevel = (typeof LOG_LEVEL)[number];

const levelMap: Record<LogLevel, number> = {
  TRACE: 0,
  DEBUG: 100,
  INFO: 200,
  WARN: 400,
  ERROR: 500,
  ALERT: 700,
} as const;

const prettySeverityMap: Record<LogLevel, string> = {
  TRACE: `${kleur.magenta("trace")} - `,
  WARN: `${kleur.yellow("warn")}  - `,
  DEBUG: `${kleur.blue("debug")} - `,
  INFO: `${kleur.green("info")}  - `,
  ERROR: `${kleur.red("error")} - `,
  ALERT: `${kleur.bgRed().white("alert")} - `,
};

const isLogLevel = (value: unknown): value is LogLevel =>
  typeof value === "string" && LOG_LEVEL.includes(value as LogLevel);

const getLogLevel = (): LogLevel => {
  const logLevel = (Bun.env["LOG_LEVEL"] ?? "INFO").toUpperCase();

  if (!isLogLevel(logLevel)) {
    throw new Error(`Invalid log level: ${logLevel}`);
  }

  return logLevel;
};

const logLevel = getLogLevel();

const logFnMap: Record<LogLevel, (...data: unknown[]) => void> = {
  TRACE: console.trace,
  DEBUG: console.debug,
  INFO: console.info,
  WARN: console.warn,
  ERROR: console.error,
  ALERT: console.error,
};

const logPretty = (
  level: LogLevel,
  logFn: (...data: unknown[]) => void,
  message: string,
  meta?: unknown,
) => {
  const prettySeverity = prettySeverityMap[level];

  let logFmt = "";

  if (meta != undefined) {
    Object.entries(meta).forEach(([key, value]) => {
      logFmt += ` ${key}=${value}`;
    });
  }

  logFn(prettySeverity + message + logFmt);
};

const logJson = (level: LogLevel, message: string, meta?: unknown) => {
  // If meta is an error, put the error details in dedicated fields.
  if (meta instanceof Error) {
    const logObj: Record<string, unknown> = {
      // If this is a special error, other fields get logged too.
      ...meta,
      // Only send the error fields once with their dedicated prefix.
      stack: undefined,
      name: undefined,
      level,
      message,
      timestamp: new Date(),
      // Use dedicated error fields.
      error_message: meta.message,
      error_name: meta.name,
      error_stack: meta.stack,
    };

    console.log(
      JSON.stringify(
        logObj,
        // Without this JSON.stringify will throw when trying to serialize a bigint.
        (_key: string, value: unknown) =>
          typeof value === "bigint" ? value.toString() + "n" : value,
      ),
    );
    // Not an error, put extra fields on the top level.
  } else {
    let logObj: Record<string, unknown> = {};

    if (typeof meta === "object") {
      logObj = {
        ...meta,
        // These fields overwrite an meta fields.
        level,
        message,
        timestamp: new Date(),
      };
    } else {
      logObj = {
        level,
        message,
        timestamp: new Date(),
        meta,
      };
    }

    console.log(
      JSON.stringify(
        logObj,
        // Without this JSON.stringify will throw when trying to serialize a bigint.
        (_key: string, value: unknown) =>
          typeof value === "bigint" ? value.toString() + "n" : value,
      ),
    );
  }
};

export const log = (
  level = "DEBUG" as LogLevel,
  message: string,
  meta?: unknown,
): void => {
  if (levelMap[level] < levelMap[logLevel]) {
    return undefined;
  }

  const logMode = getEnvBool("LOG_JSON") ? "json" : "pretty";

  if (logMode === "pretty") {
    const logFn = logFnMap[level];
    logPretty(level, logFn, message, meta);
  } else {
    logJson(level, message, meta);
  }
};

const makeLogWithLevel =
  (level: LogLevel) => (message: string, meta?: unknown) =>
    log(level, message, meta);

export const trace = makeLogWithLevel("TRACE");
export const debug = makeLogWithLevel("DEBUG");
export const info = makeLogWithLevel("INFO");
export const warn = makeLogWithLevel("WARN");
export const error = makeLogWithLevel("ERROR");
export const alert = makeLogWithLevel("ALERT");

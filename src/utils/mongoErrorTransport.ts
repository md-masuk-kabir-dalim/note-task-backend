import Transport from "winston-transport";
import type { LogEntry } from "winston";
import { ErrorLog } from "../app/modules/error-logs/error.model";

class MongoErrorTransport extends Transport {
  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
  }

  log(info: LogEntry, callback: () => void): void {
    setImmediate(() => {
      this.emit("logged", info);
    });

    if (info.level !== "error") {
      callback();
      return;
    }

    ErrorLog.create({
      level: info.level,
      message: info.message,
      stack: info.stack,
      statusCode: (info as any).statusCode,
      route: (info as any).route,
      method: (info as any).method,
      userId: (info as any).userId,
      ip: (info as any).ip,
      userAgent: (info as any).userAgent,
      service: (info as any).service,
      environment: process.env.NODE_ENV,
      meta: (info as any).meta,
    }).catch(() => {});

    callback();
  }
}

export default MongoErrorTransport;

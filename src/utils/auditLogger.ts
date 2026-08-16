// import path from "path";
// import fs from "fs";
// import { createLogger, format, transports } from "winston";

// // -------------------- Ensure audit logs folder exists --------------------
// const auditLogDir = path.join(process.cwd(), "logs", "audit");
// if (!fs.existsSync(auditLogDir)) {
//   fs.mkdirSync(auditLogDir, { recursive: true });
// }

// // -------------------- Create audit logger --------------------
// const auditLogger = createLogger({
//   level: "warn",
//   format: format.combine(
//     format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
//     format.json()
//   ),
//   transports: [
//     new transports.File({
//       filename: path.join(auditLogDir, "security-events.log"),
//       maxsize: 5 * 1024 * 1024, // 5 MB
//       maxFiles: 10,
//       tailable: true,
//     }),
//   ],
//   exitOnError: false,
// });

// // -------------------- Export function --------------------
// export const logSecurityEvent = (
//   event: string,
//   meta: Record<string, any> = {}
// ) => {
//   auditLogger.warn({ event, ...meta });
// };




import { createLogger, format, transports } from "winston";

// -------------------- Console-only audit logger --------------------
const auditLogger = createLogger({
  level: "warn",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.json()
  ),
  transports: [
    new transports.Console()
  ],
  exitOnError: false,
});

// -------------------- Export function --------------------
export const logSecurityEvent = (
  event: string,
  meta: Record<string, any> = {}
) => {
  auditLogger.warn({ event, ...meta });
};

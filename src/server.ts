import http from "http";
import app from "./app";
import config from "./config";
import connectDB from "./config/database";
import { initiateSuperAdmin } from "./app/db/db";

async function main() {
  try {
    console.log(`✅ Worker connected to the cluster`);

    // Create HTTP server
    const server = http.createServer(app);

    await connectDB();
    await initiateSuperAdmin();

    // Start server
    server.listen(config.port, () => {
      console.log(`✅ Worker running on port ${config.port}`);
    });

    // Exit handler
    const exitHandler = () => {
      server.close(() => {
        console.info(`❌ Worker ${process.pid} closed`);
        process.exit(1);
      });
    };

    // Error handling
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      exitHandler();
    });

    process.on("unhandledRejection", (error) => {
      console.error("❌ Unhandled Rejection:", error);
      exitHandler();
    });
  } catch (err) {
    console.error(`❌ Worker ${process.pid} failed to start:`, err);
    process.exit(1);
  }
}

main();

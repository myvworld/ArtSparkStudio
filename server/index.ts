import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "@db";
import { sql } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add detailed request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

(async () => {
  try {
    console.log('Starting server initialization...');

    // Test database connection before starting server
    try {
      console.log('Testing database connection...');
      await db.execute(sql`SELECT 1 as test`);
      console.log('Database connection verified');
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      throw dbError;
    }

    const server = registerRoutes(app);

    // Enhanced error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error in request:', {
        status: err.status || err.statusCode,
        message: err.message,
        stack: err.stack
      });

      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ 
        message,
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
      });
    });

    console.log('Setting up Vite or static serving...');
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server successfully started and listening on port ${PORT}`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('Shutting down server...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  }
})();
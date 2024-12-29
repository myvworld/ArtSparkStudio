import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "@db";
import { sql } from "drizzle-orm";
import { initializeOpenAI } from "./openai";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced request logging middleware
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
    if (path.startsWith("/api") && process.env.NODE_ENV !== 'production') {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && Object.keys(capturedJsonResponse).length < 10) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// Global error handlers with detailed logging
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  if (reason instanceof Error) {
    console.error('Stack trace:', reason.stack);
  }
});

async function startServer() {
  try {
    console.log('Starting server initialization...');

    // Verify environment variables first
    const requiredEnvVars = ['DATABASE_URL', 'OPENAI_API_KEY'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    console.log('Environment variables validated');

    // Test database connection with timeout
    try {
      console.log('Testing database connection...');
      const dbTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 5000);
      });

      const dbTest = db.execute(sql`SELECT 1 as test`);
      await Promise.race([dbTest, dbTimeout]);

      console.log('Database connection verified successfully');
    } catch (dbError) {
      console.error('Database connection test failed:', {
        error: dbError instanceof Error ? dbError.message : dbError,
        stack: dbError instanceof Error ? dbError.stack : undefined
      });
      throw new Error('Failed to connect to database');
    }

    // Initialize OpenAI client
    try {
      console.log('Initializing OpenAI client...');
      await initializeOpenAI();
      console.log('OpenAI client initialized successfully');
    } catch (openaiError) {
      console.error('OpenAI initialization failed:', {
        error: openaiError instanceof Error ? openaiError.message : openaiError,
        stack: openaiError instanceof Error ? openaiError.stack : undefined
      });
      throw new Error('Failed to initialize OpenAI client');
    }

    // Initialize routes and server
    console.log('Initializing routes...');
    const server = registerRoutes(app);

    // Enhanced error handling middleware with detailed logging
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error in request:', {
        status: err.status || err.statusCode,
        message: err.message,
        stack: err.stack,
        details: err
      });

      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ 
        message,
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
      });
    });

    // Setup Vite or static serving
    console.log('Setting up application server...');
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = parseInt(process.env.PORT || "3000");
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server successfully started and listening on port ${PORT}`);
    });

    // Graceful shutdown handler
    const shutdown = () => {
      console.log('Initiating graceful shutdown...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });

      // Force exit if graceful shutdown fails
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Fatal error during server startup:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

startServer();
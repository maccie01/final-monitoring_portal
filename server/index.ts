import express, { type Request, Response, NextFunction } from "express";
import { setupRoutes } from "./routes/index";
import { setupVite, serveStatic, log } from "./vite";
import { emailService } from "./email-service";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  try {
    // Initialize database connection after dotenv is loaded
    const { initializeDatabase } = await import("./db");
    await initializeDatabase();

    // Special route for /startki iframe wrapper - must be before other routes
    app.get("/startki", (req, res) => {
      const iframeHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Heatcare KI-System</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #1a1a1a;
    }
    iframe {
      border: none;
      width: 100%;
      height: 100vh;
    }
  </style>
</head>
<body>
  <iframe src="/" id="app-frame" allow="fullscreen"></iframe>
  <script>
    // Keep URL as /startki
    function keepUrl() {
      if (window.location.pathname !== '/startki') {
        window.history.replaceState({}, 'Heatcare KI-System', '/startki');
      }
    }
    
    // Initial URL lock
    keepUrl();
    
    // Monitor for URL changes every 500ms
    setInterval(keepUrl, 500);
    
    // Prevent browser navigation
    window.addEventListener('beforeunload', keepUrl);
    window.addEventListener('popstate', function(e) {
      e.preventDefault();
      keepUrl();
    });
    
    // Hide address bar on mobile
    window.scrollTo(0, 1);
  </script>
</body>
</html>`;
      res.status(200).set({ "Content-Type": "text/html" }).end(iframeHtml);
    });

    const server = await setupRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('Application error:', err);
      res.status(status).json({ message });
      // Don't rethrow error to prevent crash
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, async () => {
      log(`serving on port ${port}`);
      
      // Initialize email service to ensure Portal-DB entry exists
      try {
        await emailService.initialize();
      } catch (error) {
        log('E-Mail-Service Initialisierung fehlgeschlagen:', error instanceof Error ? error.message : String(error));
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('Received SIGINT, shutting down gracefully');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

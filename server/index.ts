import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startAbandonedCartScheduler } from "./abandoned-cart-service";
import { storage } from "./storage";

const app = express();

// Enable gzip compression for all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Compression level (0-9, default 6 is balanced)
}));

// Trust proxy - Required for secure cookies behind HTTPS proxy (Replit, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security headers middleware
app.use((req, res, next) => {
  // Content Security Policy - Fixed to allow Google Maps API
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "media-src 'self' blob: data:; " +
    "connect-src 'self' https://www.google-analytics.com https://maps.googleapis.com https://storage.googleapis.com; " +
    "frame-src 'self' https://www.google.com https://maps.google.com; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );
  
  // X-Frame-Options to prevent clickjacking (allow Google Maps)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // X-Content-Type-Options to prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cross-Origin Embedder Policy (relaxed for Google Maps)
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Cross-Origin Opener Policy (relaxed for Google Maps)
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  
  // Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  next();
});

// Performance and caching headers for static assets
app.use('/assets', (req, res, next) => {
  // Cache static assets for 1 year
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
});

app.use('/js', (req, res, next) => {
  // Cache JS files for 1 week with etag validation
  res.setHeader('Cache-Control', 'public, max-age=604800');
  next();
});

app.use('/css', (req, res, next) => {
  // Cache CSS files for 1 week with etag validation
  res.setHeader('Cache-Control', 'public, max-age=604800');
  next();
});

// Increase the JSON payload size limit to 50MB
app.use(express.json({ limit: '50mb' }));
// Increase the URL-encoded payload size limit to 50MB
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve static files from public folder (videos, images, etc.)
app.use(express.static(path.join(process.cwd(), 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    }
  }
}));

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    
    // Start abandoned cart reminder scheduler
    startAbandonedCartScheduler();
    
    // Auto-generate delivery windows from weekly templates for next 5 days (0-4 inclusive)
    try {
      const result = await storage.generateWindowsFromTemplates(4);
      if (result.created > 0) {
        log(`[Delivery Windows] Auto-generated ${result.created} windows from templates, skipped ${result.skipped} existing`);
      }
    } catch (error) {
      console.error("[Delivery Windows] Error auto-generating windows:", error);
    }
  });
})();

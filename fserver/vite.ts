import type { Express } from "express";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // Development mode: serve static files from src directory
    app.use('/src', express.static(path.resolve(__dirname, 'src'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
      }
    }));
    
    // Serve other static assets
    app.use(express.static(path.resolve(__dirname, 'public')));
    
    // Handle routes - only serve HTML for non-asset requests
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      
      // Skip API routes
      if (url.startsWith('/api')) {
        return next();
      }
      
      // Skip static assets
      if (url.startsWith('/src/') || url.includes('.')) {
        return next();
      }

      try {
        const template = await fs.promises.readFile(
          path.resolve(__dirname, "index.html"),
          "utf-8"
        );
        
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        console.error('Error serving HTML:', e);
        next(e);
      }
    });
  } else {
    // Production mode: serve built assets
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    
    // Handle client-side routing
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      
      // Skip API routes
      if (url.startsWith('/api')) {
        return next();
      }

      try {
        const template = await fs.promises.readFile(
          path.resolve(distPath, "index.html"),
          "utf-8"
        );
        
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        console.error('Error serving HTML:', e);
        next(e);
      }
    });
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
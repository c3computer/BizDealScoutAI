import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { Resend } from 'resend';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.resolve(process.cwd(), "dist/index.html"));

const DB_FILE = isProduction 
  ? path.resolve("/tmp", "deals_db.json") 
  : path.resolve(process.cwd(), "deals_db.json");

let memoryDb: any[] = [];

// Initialize DB
try {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  } else {
    memoryDb = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  }
} catch (e) {
  console.warn("Could not initialize file DB, falling back to memory DB", e);
}

// OAuth Routes
app.get('/api/auth/google/url', (req, res) => {
  const redirectUri = req.query.redirect_uri as string;
  
  if (!redirectUri) {
    return res.status(400).json({ error: 'redirect_uri is required' });
  }
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets email profile openid',
    access_type: 'offline',
    prompt: 'consent',
    state: redirectUri // Pass redirectUri in state to use during callback
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
});

app.get(['/api/auth/google/callback', '/api/auth/google/callback/'], async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    res.send(`
      <html><body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'No code provided' }, '*');
            window.close();
          }
        </script>
        <p>Authentication failed. You can close this window.</p>
      </body></html>
    `);
    return;
  }

  try {
    let redirectUri = state as string;
    if (!redirectUri) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      redirectUri = `${protocol}://${host}/api/auth/google/callback`;
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || tokens.error || 'Failed to exchange token');
    }

    res.send(`
      <html><body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
        <p>Authentication successful. This window should close automatically.</p>
      </body></html>
    `);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.send(`
      <html><body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error.message}' }, '*');
            window.close();
          }
        </script>
        <p>Authentication failed: ${error.message}. You can close this window.</p>
      </body></html>
    `);
  }
});

const ADMIN_CONFIG_FILE = isProduction 
  ? path.resolve("/tmp", "admin_config.json") 
  : path.resolve(process.cwd(), "admin_config.json");

let adminPassword = "admin";

try {
  if (fs.existsSync(ADMIN_CONFIG_FILE)) {
    const config = JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE, "utf-8"));
    if (config.password) adminPassword = config.password;
  } else {
    fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify({ password: adminPassword }));
  }
} catch (e) {
  console.warn("Could not initialize admin config", e);
}

// API routes
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === adminPassword) {
    res.json({ token: "admin_secret_123" });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

app.post("/api/admin/change-password", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== "Bearer admin_secret_123") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    res.status(400).json({ error: "Password must be at least 4 characters" });
    return;
  }
  
  adminPassword = newPassword;
  try {
    fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify({ password: adminPassword }));
  } catch (e) {
    console.warn("Could not write admin config", e);
  }
  
  res.json({ success: true });
});

app.get("/api/admin/deals", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== "Bearer admin_secret_123") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      res.json(data);
    } else {
      res.json(memoryDb);
    }
  } catch (err) {
    res.json(memoryDb);
  }
});

app.post("/api/deals", (req, res) => {
  try {
    const newDeal = req.body;
    let data = memoryDb;
    
    if (fs.existsSync(DB_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      } catch (e) {}
    }
    
    // Check if deal exists for this user and url
    const existingIndex = data.findIndex((d: any) => d.url === newDeal.url && d.userEmail === newDeal.userEmail);
    
    if (existingIndex > -1) {
      data[existingIndex] = { ...data[existingIndex], ...newDeal, timestamp: Date.now() };
    } else {
      data.push({ ...newDeal, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() });
    }
    
    memoryDb = data;
    
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn("Could not write to file DB, saved to memory");
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save deal" });
  }
});

app.post("/api/extension/batch", (req, res) => {
  try {
    const { deals } = req.body;
    if (!deals || !Array.isArray(deals)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    let data = memoryDb;
    if (fs.existsSync(DB_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      } catch (e) {}
    }

    deals.forEach((deal: any) => {
      const existingIndex = data.findIndex((d: any) => d.url === deal.url);
      if (existingIndex > -1) {
        data[existingIndex] = { ...data[existingIndex], ...deal, timestamp: Date.now(), source: 'extension' };
      } else {
        data.push({ ...deal, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), source: 'extension' });
      }
    });

    memoryDb = data;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn("Could not write to file DB, saved to memory");
    }

    res.json({ success: true, count: deals.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to save batch" });
  }
});

app.get("/api/extension/deals", (req, res) => {
  try {
    let data = memoryDb;
    if (fs.existsSync(DB_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      } catch (e) {}
    }
    
    // Return deals that came from the extension
    const extensionDeals = data.filter((d: any) => d.source === 'extension');
    res.json(extensionDeals);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch extension deals" });
  }
});

app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, text } = req.body;
    
    if (!to || !subject || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return res.status(400).json({ error: "RESEND_API_KEY is not configured on the server." });
    }

    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: 'Acquisition Edge <onboarding@resend.dev>', // Default resend testing domain
      to,
      subject,
      text
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to send email" });
  }
});

async function startServer() {
  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Failed to start Vite", e);
    }
  } else {
    app.use(express.static("dist"));
    app.use((req, res) => {
      res.sendFile(path.resolve(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

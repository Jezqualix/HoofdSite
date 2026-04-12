const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Zorg dat logs directory bestaat
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Load apps config
function loadApps() {
  const configPath = path.join(__dirname, 'config', 'apps.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw);
}

// Functie om bezoeker IP te loggen
function logVisitorIP(ip) {
  const logsPath = path.join(__dirname, 'logs', 'visitors.json');
  const now = new Date().toISOString();

  let visitors = [];
  if (fs.existsSync(logsPath)) {
    try {
      const raw = fs.readFileSync(logsPath, 'utf-8');
      visitors = JSON.parse(raw);
    } catch (e) {
      visitors = [];
    }
  }

  visitors.push({
    timestamp: now,
    ip: ip
  });

  fs.writeFileSync(logsPath, JSON.stringify(visitors, null, 2));
}

// Functie om IP-adres uit request te halen (alleen IPv4)
function getClientIP(req) {
  let ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.socket.remoteAddress ||
           'unknown';

  // Verwijder IPv4-mapped IPv6 prefix (::ffff:)
  if (ip.includes('::ffff:')) {
    ip = ip.replace(/^.*::ffff:/, '');
  }

  return ip;
}

// Functie om app-klik te loggen
function logAppClick(ip, appId, appName) {
  const logsPath = path.join(__dirname, 'logs', 'clicks.json');
  const now = new Date().toISOString();

  let clicks = [];
  if (fs.existsSync(logsPath)) {
    try {
      const raw = fs.readFileSync(logsPath, 'utf-8');
      clicks = JSON.parse(raw);
    } catch (e) {
      clicks = [];
    }
  }

  clicks.push({
    timestamp: now,
    ip: ip,
    appId: appId,
    appName: appName
  });

  fs.writeFileSync(logsPath, JSON.stringify(clicks, null, 2));
}

// Routes
app.get('/', (req, res) => {
  const clientIP = getClientIP(req);
  logVisitorIP(clientIP);

  const apps = loadApps();
  res.render('index', { apps, clientIP });
});

// API: Log app click
app.post('/api/log-click', express.json(), (req, res) => {
  const clientIP = getClientIP(req);
  const { appId, appName } = req.body;

  if (appId && appName) {
    logAppClick(clientIP, appId, appName);
  }

  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`HoofdSite draait op http://localhost:${PORT}`);
});

const express  = require('express');
const printer  = require('pdf-to-printer');
const fetch    = require('node-fetch');
const fs       = require('fs');
const path     = require('path');
const { exec } = require('child_process');
const app      = express();

// Load environment variables from parent directory .env.local if present
try {
  const possiblePaths = [
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '.env'),
  ];
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const equalsIdx = trimmed.indexOf('=');
          if (equalsIdx > 0) {
            const key = trimmed.substring(0, equalsIdx).trim();
            let value = trimmed.substring(equalsIdx + 1).trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      });
      console.log(`[ENV] Loaded environment configuration from: ${envPath}`);
      break;
    }
  }
} catch (e) {
  console.log('[ENV WARNING] Error parsing environment configurations:', e.message);
}

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// GET /status — health check + list printers
app.get('/status', async (req, res) => {
  try {
    const printers = await printer.getPrinters();
    res.json({ alive: true, printers: printers.map(p => p.name) });
  } catch (e) {
    res.status(500).json({ alive: false, error: e.message });
  }
});

// POST /print — download, save as PDF locally, open, and optionally print physically
app.post('/print', async (req, res) => {
  const { fileUrl, jobId, fileName, options } = req.body;
  const {
    colorMode    = 'bw',
    sides        = 'single',
    copies       = 1,
    orientation  = 'portrait',
    paperSize    = 'A4',
  } = options || {};

  const tempDir  = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const tempFile = path.join(tempDir, `job_${jobId}_${Date.now()}.pdf`);

  try {
    // Download PDF from secure URL
    const resp   = await fetch(fileUrl);
    if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
    const buffer = await resp.buffer();
    await fs.promises.writeFile(tempFile, buffer);
    console.log(`[PRINT SERVER] Downloaded document for Job ID: ${jobId}`);

    // Create permanent printed PDFs directory
    const printedDir = path.join(__dirname, 'printed_pdfs');
    await fs.promises.mkdir(printedDir, { recursive: true });

    // Clean and prepare the filename
    const baseName = fileName || 'document.pdf';
    const cleanFileName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalPrintedFile = path.join(printedDir, `Job_${jobId}_${cleanFileName}`);

    // Copy to printed folder
    await fs.promises.copyFile(tempFile, finalPrintedFile);
    console.log(`[PRINT SERVER] Saved PDF locally to: ${finalPrintedFile}`);

    // Automatically open the printed PDF in the default system viewer
    if (process.platform === 'win32') {
      exec(`start "" "${finalPrintedFile}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${finalPrintedFile}"`);
    } else {
      exec(`xdg-open "${finalPrintedFile}"`);
    }
    console.log(`[PRINT SERVER] Triggered default viewer to open printed file.`);

    // Spool print job using pdf-to-printer (wrapped in try/catch to ensure reliability)
    try {
      console.log(`[PRINT SERVER] Attempting physical spool print (Copies: ${copies})...`);
      await printer.print(tempFile, {
        copies:    Number(copies),
        color:     colorMode === 'color',
        duplex:    sides === 'double' ? 'two-sided-long-edge' : false,
        scale:     'fit',
        paperSize: paperSize,
        landscape: orientation === 'landscape',
      });
      console.log('[PRINT SERVER] Successfully spooled to physical printer queue.');
    } catch (printErr) {
      console.warn('[PRINT SERVER WARNING] Physical printer spooling failed or was cancelled:', printErr.message);
      console.warn('[PRINT SERVER] Kiosk operation is unaffected since PDF was saved and opened locally.');
    }

    // Clean up temporary file
    await fs.promises.unlink(tempFile);
    res.json({ success: true, localFilePath: finalPrintedFile });
  } catch (err) {
    console.error('[PRINT ERROR]', err.message);
    if (fs.existsSync(tempFile)) {
      try { await fs.promises.unlink(tempFile); } catch (e) {}
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clean up files in printed_pdfs older than 7 days
async function pruneOldPdfs() {
  const printedDir = path.join(__dirname, 'printed_pdfs');
  try {
    if (!fs.existsSync(printedDir)) return;
    const files = await fs.promises.readdir(printedDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    for (const file of files) {
      const filePath = path.join(printedDir, file);
      const stats = await fs.promises.stat(filePath);
      if (now - stats.mtimeMs > maxAge) {
        await fs.promises.unlink(filePath);
        console.log(`[PRINT SERVER] Pruned old printed document: ${file}`);
      }
    }
  } catch (err) {
    console.error('[CLEANUP WARNING] Error pruning old printed files:', err.message);
  }
}

const KIOSK_ID = process.env.KIOSK_ID || 'KIOSK_001';
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

app.listen(3001, () => {
  console.log(`PrintDrop print server starting for Kiosk: ${KIOSK_ID} → http://localhost:3001`);
  console.log(`Print server targeted web app URL: ${APP_URL}`);
  
  printer.getPrinters().then(p => {
    console.log('Available Printers:', p.map(x => x.name).join(', ') || 'None found');
  }).catch(err => {
    console.log('Printer retrieval unavailable in current shell context:', err.message);
  });

  // Background heartbeat ping to keep kiosk marked online/active in dashboard
  const pingKiosk = async () => {
    try {
      const res = await fetch(`${APP_URL}/api/kiosk/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kioskId: KIOSK_ID }),
      });
      if (!res.ok) {
        console.log(`[PING WARNING] Next.js server responded with status: ${res.status}`);
      } else {
        console.log(`[PING] Heartbeat successfully registered for ${KIOSK_ID}`);
      }
    } catch (err) {
      console.log(`[PING ERROR] Could not reach Next.js server at ${APP_URL}:`, err.message);
    }
  };

  pingKiosk();
  setInterval(pingKiosk, 60000);
  
  // Prune old pdfs on start and every 24 hours
  pruneOldPdfs().catch(console.error);
  setInterval(() => {
    pruneOldPdfs().catch(console.error);
  }, 24 * 60 * 60 * 1000);
});

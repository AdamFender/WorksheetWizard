import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import morgan from "morgan";
import cors from "cors";

const app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC = path.join(__dirname, "../public");
const DATA_DIR = path.join(__dirname, "../data");

// Ensure data dir exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data dir:", err);
  }
}
await ensureDataDir();

// Serve static frontend
app.use(express.static(PUBLIC));

// Save a worksheet JSON (teacher saves their current worksheet)
// POST /api/save  { id?:string, meta: {...}, html: "<...>" }
app.post("/api/save", async (req, res) => {
  try {
    const payload = req.body;
    const id = payload.id || `ws-${Date.now()}`;
    const filepath = path.join(DATA_DIR, `${id}.json`);
    await fs.writeFile(filepath, JSON.stringify(payload, null, 2), "utf8");
    res.json({ ok: true, id, path: `/data/${id}.json` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// Load a saved worksheet by id
// GET /api/load/:id
app.get("/api/load/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filepath = path.join(DATA_DIR, `${id}.json`);
    const txt = await fs.readFile(filepath, "utf8");
    res.setHeader("Content-Type", "application/json");
    res.send(txt);
  } catch (err) {
    res.status(404).json({ ok: false, error: "Not found" });
  }
});

// Serve raw data files for convenience (only in dev; don't expose sensitive production data)
app.get("/data/:file", async (req, res) => {
  try {
    const file = req.params.file;
    const filepath = path.join(DATA_DIR, file);
    res.sendFile(filepath);
  } catch (err) {
    res.status(404).send("Not found");
  }
});

// Fallback to index.html for SPA behaviour
app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening: http://localhost:${PORT}`));

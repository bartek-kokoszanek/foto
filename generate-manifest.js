// Generates manifest.json from the contents of /photos.
// Run automatically by .github/workflows/deploy.yml on every push,
// but can also be run manually: `node scripts/generate-manifest.js`

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PHOTOS_DIR = path.join(ROOT, "photos");
const MANIFEST_PATH = path.join(ROOT, "manifest.json");

const VALID_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
]);

function loadExistingCaptions() {
  if (!fs.existsSync(MANIFEST_PATH)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const map = {};
    for (const entry of data) {
      if (entry && entry.file) {
        map[entry.file] = entry.caption ?? null;
      }
    }
    return map;
  } catch (err) {
    console.warn("Nie udało się wczytać istniejącego manifest.json:", err.message);
    return {};
  }
}

function main() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.writeFileSync(MANIFEST_PATH, "[]\n");
    console.log("Folder photos/ nie istnieje — zapisano pusty manifest.json.");
    return;
  }

  const files = fs
    .readdirSync(PHOTOS_DIR)
    .filter((f) => VALID_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

  const existingCaptions = loadExistingCaptions();

  const manifest = files.map((file) => ({
    file,
    caption: existingCaptions[file] ?? null,
  }));

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Zapisano manifest.json z ${manifest.length} zdjęciami.`);
}

main();

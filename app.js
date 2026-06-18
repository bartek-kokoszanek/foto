(function () {
  "use strict";

  const owner = location.hostname.replace(".github.io", "");
  const repo  = location.pathname.split("/").filter(Boolean)[0] || "";
  const API   = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/photos";
  const VALID = /\.(jpe?g|png|webp|gif|avif)$/i;

  const galleryEl      = document.getElementById("gallery");
  const photoCountEl   = document.getElementById("photo-count");
  const statusEl       = document.getElementById("toolbar-status");
  const downloadAllBtn = document.getElementById("download-all");
  const downloadSelBtn = document.getElementById("download-selected");
  const selectAllBtn   = document.getElementById("select-all");
  const deselectAllBtn = document.getElementById("deselect-all");
  const selectCountEl  = document.getElementById("select-count");

  const lightbox   = document.getElementById("lightbox");
  const lbImage    = document.getElementById("lb-image");
  const lbCaption  = document.getElementById("lb-caption");
  const lbSize     = document.getElementById("lb-size");
  const lbCounter  = document.getElementById("lb-counter");
  const lbDownload = document.getElementById("lb-download");
  const lbClose    = document.getElementById("lb-close");
  const lbPrev     = document.getElementById("lb-prev");
  const lbNext     = document.getElementById("lb-next");
  const lbBackdrop = lightbox.querySelector(".lb-backdrop");

  let photos = [];
  let selected = new Set();
  let currentIndex = -1;

  function shortName(n) { return n.replace(/\.[^.]+$/, ""); }
  function ext(n) { const m = n.match(/\.([^.]+)$/); return m ? m[1].toUpperCase() : ""; }
  function formatSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function updateSelectionUI() {
    const n = selected.size;
    downloadSelBtn.disabled = n === 0;
    selectCountEl.hidden    = n === 0;
    deselectAllBtn.hidden   = n === 0;
    if (n > 0) selectCountEl.textContent = n === 1 ? "1 zaznaczone" : n + " zaznaczonych";
  }

  function toggleSelect(i) {
    const card = galleryEl.querySelectorAll(".card")[i];
    if (selected.has(i)) { selected.delete(i); card.classList.remove("selected"); }
    else                  { selected.add(i);    card.classList.add("selected"); }
    updateSelectionUI();
  }

  function render(list) {
    galleryEl.innerHTML = "";
    if (list.length === 0) {
      galleryEl.innerHTML = '<p class="state-msg">Brak zdjęć w folderze photos/ — wgraj je na GitHub i zrób commit.</p>';
      photoCountEl.textContent = ""; downloadAllBtn.disabled = true; return;
    }
    downloadAllBtn.disabled = false;
    photoCountEl.textContent = list.length + " " + (list.length === 1 ? "zdjęcie" : "zdjęć");

    list.forEach((photo, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", shortName(photo.name));

      const img = document.createElement("img");
      img.src = photo.url; img.className = "card-thumb";
      img.loading = "lazy"; img.decoding = "async"; img.alt = shortName(photo.name);

      const info = document.createElement("div");
      info.className = "card-info";
      info.innerHTML =
        '<p class="card-name">' + shortName(photo.name) + "</p>" +
        '<p class="card-meta">' + ext(photo.name) +
        (photo.size ? " &middot; " + formatSize(photo.size) : "") + "</p>";

      // Checkbox — click toggles selection, does NOT open lightbox
      const check = document.createElement("div");
      check.className = "card-check";
      check.setAttribute("role", "checkbox");
      check.setAttribute("aria-label", "Zaznacz");
      check.setAttribute("tabindex", "0");
      check.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1200" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

      check.addEventListener("click", e => {
        e.stopPropagation();   // prevent card click from firing
        toggleSelect(i);
      });
      check.addEventListener("keydown", e => {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); e.stopPropagation(); toggleSelect(i); }
      });

      card.appendChild(img);
      card.appendChild(info);
      card.appendChild(check);

      // Card click = open lightbox (ignore clicks on checkbox)
      card.addEventListener("click", (e) => {
        if (e.target.closest(".card-check")) return;
        openLightbox(i);
      });
      card.addEventListener("keydown", e => {
        if (e.key === "Enter") openLightbox(i);
      });

      galleryEl.appendChild(card);
    });
  }

  selectAllBtn.addEventListener("click", () => {
    photos.forEach((_, i) => { selected.add(i); galleryEl.querySelectorAll(".card")[i].classList.add("selected"); });
    updateSelectionUI();
  });
  deselectAllBtn.addEventListener("click", () => {
    selected.clear();
    galleryEl.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
    updateSelectionUI();
  });

  async function packZip(indices, zipName) {
    const zip = new JSZip();
    for (let k = 0; k < indices.length; k++) {
      const photo = photos[indices[k]];
      statusEl.textContent = "Pakowanie " + (k + 1) + " / " + indices.length + "…";
      const res = await fetch(photo.url);
      if (!res.ok) throw new Error("Błąd pobierania: " + photo.name);
      zip.file(photo.name, await res.blob());
    }
    statusEl.textContent = "Tworzenie archiwum…";
    const blob = await zip.generateAsync({ type: "blob" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: zipName });
    document.body.appendChild(a); a.click(); a.remove();
    statusEl.textContent = "Pobrano ✓";
    setTimeout(() => statusEl.textContent = "", 3500);
  }

  downloadAllBtn.addEventListener("click", async () => {
    downloadAllBtn.disabled = true;
    try { await packZip(photos.map((_, i) => i), "galeria.zip"); }
    catch (e) { statusEl.textContent = "Błąd: " + e.message; }
    finally { downloadAllBtn.disabled = false; }
  });
  downloadSelBtn.addEventListener("click", async () => {
    if (!selected.size) return;
    downloadSelBtn.disabled = true;
    try { await packZip([...selected].sort((a, b) => a - b), "zaznaczone.zip"); }
    catch (e) { statusEl.textContent = "Błąd: " + e.message; }
    finally { downloadSelBtn.disabled = selected.size === 0; }
  });

  // Lightbox
  function openLightbox(i) {
    currentIndex = i; updateLightbox();
    lightbox.hidden = false; document.body.style.overflow = "hidden";
    lbClose.focus();
  }
  function closeLightbox() { lightbox.hidden = true; document.body.style.overflow = ""; }
  function updateLightbox() {
    const p = photos[currentIndex]; if (!p) return;
    lbImage.src = p.url; lbImage.alt = p.name;
    lbCaption.textContent = p.name;
    lbSize.textContent = p.size ? formatSize(p.size) : "";
    lbCounter.textContent = (currentIndex + 1) + " / " + photos.length;
    lbDownload.href = p.url; lbDownload.setAttribute("download", p.name);
  }

  lbClose.addEventListener("click", closeLightbox);
  lbBackdrop.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", () => { currentIndex = (currentIndex - 1 + photos.length) % photos.length; updateLightbox(); });
  lbNext.addEventListener("click", () => { currentIndex = (currentIndex + 1) % photos.length; updateLightbox(); });
  document.addEventListener("keydown", e => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft")  { currentIndex = (currentIndex - 1 + photos.length) % photos.length; updateLightbox(); }
    if (e.key === "ArrowRight") { currentIndex = (currentIndex + 1) % photos.length; updateLightbox(); }
  });
  let tX = null;
  lightbox.addEventListener("touchstart", e => tX = e.changedTouches[0].clientX);
  lightbox.addEventListener("touchend", e => {
    if (tX === null) return;
    const dx = e.changedTouches[0].clientX - tX;
    if (Math.abs(dx) > 40) { currentIndex = (currentIndex + (dx < 0 ? 1 : -1) + photos.length) % photos.length; updateLightbox(); }
    tX = null;
  });

  // Load from GitHub API
  galleryEl.innerHTML = '<p class="state-msg">Wczytywanie…</p>';
  fetch(API)
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(data => {
      photos = data
        .filter(f => f.type === "file" && VALID.test(f.name))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))
        .map(f => ({ name: f.name, url: f.download_url, size: f.size }));
      render(photos);
    })
    .catch(err => {
      galleryEl.innerHTML = '<p class="state-msg">Nie udało się załadować zdjęć (' + err.message + ').<br>Upewnij się że repozytorium jest publiczne.</p>';
    });
})();

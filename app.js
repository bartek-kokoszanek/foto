(function () {
  "use strict";

  const galleryEl = document.getElementById("gallery");
  const photoCountEl = document.getElementById("photo-count");
  const statusEl = document.getElementById("toolbar-status");
  const downloadAllBtn = document.getElementById("download-all");
  const downloadSelBtn = document.getElementById("download-selected");
  const selectAllBtn = document.getElementById("select-all");
  const deselectAllBtn = document.getElementById("deselect-all");
  const selectCountEl = document.getElementById("select-count");

  const lightbox = document.getElementById("lightbox");
  const lbImage = document.getElementById("lb-image");
  const lbCaption = document.getElementById("lb-caption");
  const lbCounter = document.getElementById("lb-counter");
  const lbDownload = document.getElementById("lb-download");
  const lbClose = document.getElementById("lb-close");
  const lbPrev = document.getElementById("lb-prev");
  const lbNext = document.getElementById("lb-next");
  const lbBackdrop = lightbox.querySelector(".lb-backdrop");

  let photos = [];
  let selected = new Set();
  let currentIndex = -1;

  function photoPath(file) { return "photos/" + file; }

  function ext(file) {
    const m = file.match(/\.([^.]+)$/);
    return m ? m[1].toUpperCase() : "";
  }

  function shortName(file) {
    return file.replace(/\.[^.]+$/, "");
  }

  function updateSelectionUI() {
    const n = selected.size;
    downloadSelBtn.disabled = n === 0;
    selectCountEl.hidden = n === 0;
    deselectAllBtn.hidden = n === 0;
    if (n > 0) {
      selectCountEl.textContent = n === 1 ? "1 zaznaczone" : n + " zaznaczonych";
    }
  }

  function toggleSelect(index) {
    const card = galleryEl.querySelectorAll(".card")[index];
    if (selected.has(index)) {
      selected.delete(index);
      card.classList.remove("selected");
      card.setAttribute("aria-pressed", "false");
    } else {
      selected.add(index);
      card.classList.add("selected");
      card.setAttribute("aria-pressed", "true");
    }
    updateSelectionUI();
  }

  function render(list) {
    galleryEl.innerHTML = "";

    if (list.length === 0) {
      const p = document.createElement("p");
      p.className = "state-msg";
      p.textContent = "Galeria jest jeszcze pusta. Wgraj zdjęcia do folderu photos/ i zrób push.";
      galleryEl.appendChild(p);
      photoCountEl.textContent = "";
      downloadAllBtn.disabled = true;
      return;
    }

    downloadAllBtn.disabled = false;
    photoCountEl.textContent = list.length + " " + (list.length === 1 ? "zdjęcie" : "zdjęć");

    list.forEach((photo, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-pressed", "false");
      card.setAttribute("aria-label", photo.caption || shortName(photo.file));

      const img = document.createElement("img");
      img.src = photoPath(photo.file);
      img.className = "card-thumb";
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = photo.caption || "";

      const info = document.createElement("div");
      info.className = "card-info";

      const name = document.createElement("p");
      name.className = "card-name";
      name.textContent = photo.caption || shortName(photo.file);

      const meta = document.createElement("p");
      meta.className = "card-meta";
      meta.textContent = ext(photo.file);

      info.appendChild(name);
      info.appendChild(meta);

      const check = document.createElement("div");
      check.className = "card-check";
      check.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1200" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

      card.appendChild(img);
      card.appendChild(info);
      card.appendChild(check);

      let clickTimer = null;

      card.addEventListener("click", (e) => {
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
          openLightbox(i);
          return;
        }
        clickTimer = setTimeout(() => {
          clickTimer = null;
          toggleSelect(i);
        }, 220);
      });

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter") openLightbox(i);
        if (e.key === " ") { e.preventDefault(); toggleSelect(i); }
      });

      galleryEl.appendChild(card);
    });
  }

  selectAllBtn.addEventListener("click", () => {
    photos.forEach((_, i) => {
      const card = galleryEl.querySelectorAll(".card")[i];
      selected.add(i);
      card.classList.add("selected");
      card.setAttribute("aria-pressed", "true");
    });
    updateSelectionUI();
  });

  deselectAllBtn.addEventListener("click", () => {
    selected.clear();
    galleryEl.querySelectorAll(".card").forEach(c => {
      c.classList.remove("selected");
      c.setAttribute("aria-pressed", "false");
    });
    updateSelectionUI();
  });

  // Download helpers
  async function packZip(indices, zipName) {
    const zip = new JSZip();
    const total = indices.length;
    for (let k = 0; k < total; k++) {
      const photo = photos[indices[k]];
      statusEl.textContent = "Pakowanie " + (k + 1) + " / " + total + "…";
      const res = await fetch(photoPath(photo.file));
      if (!res.ok) throw new Error("Nie udało się pobrać: " + photo.file);
      zip.file(photo.file, await res.blob());
    }
    statusEl.textContent = "Tworzenie archiwum…";
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = zipName;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
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
    if (selected.size === 0) return;
    downloadSelBtn.disabled = true;
    try { await packZip([...selected].sort((a, b) => a - b), "zaznaczone.zip"); }
    catch (e) { statusEl.textContent = "Błąd: " + e.message; }
    finally { downloadSelBtn.disabled = selected.size === 0; }
  });

  // Lightbox
  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  function updateLightbox() {
    const p = photos[currentIndex];
    if (!p) return;
    lbImage.src = photoPath(p.file);
    lbImage.alt = p.caption || p.file;
    lbCaption.textContent = p.caption || shortName(p.file);
    lbCounter.textContent = (currentIndex + 1) + " / " + photos.length;
    lbDownload.href = photoPath(p.file);
    lbDownload.setAttribute("download", p.file);
  }

  lbClose.addEventListener("click", closeLightbox);
  lbBackdrop.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", () => { currentIndex = (currentIndex - 1 + photos.length) % photos.length; updateLightbox(); });
  lbNext.addEventListener("click", () => { currentIndex = (currentIndex + 1) % photos.length; updateLightbox(); });

  document.addEventListener("keydown", e => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") { currentIndex = (currentIndex - 1 + photos.length) % photos.length; updateLightbox(); }
    if (e.key === "ArrowRight") { currentIndex = (currentIndex + 1) % photos.length; updateLightbox(); }
  });

  let touchX = null;
  lightbox.addEventListener("touchstart", e => touchX = e.changedTouches[0].clientX);
  lightbox.addEventListener("touchend", e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) {
      dx < 0
        ? (currentIndex = (currentIndex + 1) % photos.length)
        : (currentIndex = (currentIndex - 1 + photos.length) % photos.length);
      updateLightbox();
    }
    touchX = null;
  });

  // Load manifest
  fetch("manifest.json")
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(data => { photos = Array.isArray(data) ? data : []; render(photos); })
    .catch(() => {
      galleryEl.innerHTML = '<p class="state-msg">Nie udało się wczytać listy zdjęć (manifest.json).<br>Sprawdź czy GitHub Action zakończył się pomyślnie.</p>';
    });
})();

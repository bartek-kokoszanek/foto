# Galeria zdjęć

Prosta, statyczna galeria zdjęć do udostępniania znajomym przez link —
hostowana bezpłatnie na GitHub Pages. Wgrywasz zdjęcia do folderu, robisz
`push`, a strona aktualizuje się sama.

## Funkcje

- Siatka zdjęć w stylu „contact sheet" + podgląd na pełnym ekranie (lightbox)
- Nawigacja strzałkami, klawiaturą i swipe'em na telefonie
- Pobieranie pojedynczego zdjęcia lub wszystkich naraz jako ZIP
- Lista zdjęć generuje się automatycznie — nie trzeba ręcznie edytować kodu

## Jak skonfigurować (raz, na początku)

1. Załóż nowe repozytorium na GitHub i wgraj do niego całą zawartość tego
   folderu.
2. W repozytorium: **Settings → Pages → Build and deployment → Source** ustaw
   na **GitHub Actions**.
3. Jeśli Twój domyślny branch nazywa się `master`, a nie `main`, zmień to w
   pliku `.github/workflows/deploy.yml` (linia `branches: [main]`).
4. Zrób pierwszy `push` — Action się uruchomi i opublikuje stronę. Link do
   gotowej galerii znajdziesz po chwili w **Settings → Pages**
   (zwykle `https://twoj-login.github.io/nazwa-repo/`).

## Jak dodawać zdjęcia (na bieżąco)

1. Wgraj pliki (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`) do folderu
   `photos/`.
2. `git add`, `git commit`, `git push`.
3. Gotowe — galeria zaktualizuje się automatycznie w ciągu minuty.

Kolejność zdjęć = alfabetyczna kolejność nazw plików. Żeby ją kontrolować,
nazywaj pliki z numerem na początku, np. `01-plaza.jpg`, `02-las.jpg`.

## Personalizacja

- **Tytuł / opis galerii** — edytuj nagłówek w `index.html` (sekcja oznaczona
  `<!-- TODO -->`).
- **Kolory / czcionki** — zmienne na górze pliku `assets/style.css` (`:root`).
- **Podpisy pod zdjęciami** — po pierwszym wygenerowaniu możesz ręcznie dopisać
  pole `"caption"` w `manifest.json`, np.:
  ```json
  { "file": "01-plaza.jpg", "caption": "Zachód słońca w Sopocie" }
  ```
  Taki podpis zostanie zachowany przy kolejnych automatycznych aktualizacjach.

## Ważne do wiedzenia

- To strona **publiczna i statyczna** — każdy, kto ma link, może ją zobaczyć.
  Nie ma logowania ani hasła. Nie wgrywaj zdjęć, którymi nie chcesz się
  dzielić z całym internetem.
- Strona ma ustawione `noindex`, więc Google nie powinien jej indeksować —
  to nie jest jednak prawdziwa ochrona, tylko uprzejma prośba do wyszukiwarek.
- Większe zdjęcia = dłuższe ładowanie, bo strona nie ma serwera, który mógłby
  je zmniejszać. Warto skompresować zdjęcia przed wgraniem, np. przez
  https://squoosh.app.

## Podgląd lokalny (opcjonalnie, przed wgraniem na GitHub)

```bash
node scripts/generate-manifest.js   # zbuduje manifest.json z folderu photos/
python3 -m http.server 8000         # albo: npx serve
```

Następnie otwórz `http://localhost:8000` w przeglądarce.

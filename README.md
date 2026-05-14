# Freight Log — Progressive Web App

A modern, offline-capable freight tracking app. Log trips with transporter, receiver, nags, pheras, freight amount and a paid/unpaid toggle. View monthly statistics with bar charts. Once installed, it behaves exactly like a native Android app — home-screen icon, fullscreen, offline.

## ✨ What's inside

| File | Purpose |
|---|---|
| `index.html` | The whole UI |
| `app.js` | All app logic + local storage |
| `manifest.json` | Tells Android this is an installable app |
| `sw.js` | Service worker — makes it work offline |
| `icon-*.png` | App icons (rendered at 192×192 and 512×512, plus maskable versions for Android) |
| `apple-touch-icon.png` | iOS home screen icon |
| `favicon.png` | Browser tab icon |

Data is stored in your phone's `localStorage` — never leaves your device.

---

## 📱 How to install on your phone

PWAs must be served over **HTTPS** (or `localhost`) to be installable. Pick whichever option suits you:

### Option A — Free hosting (easiest, recommended)

**Netlify Drop** — zero account needed:
1. Go to https://app.netlify.com/drop
2. Drag the entire `freight-pwa` folder into the page.
3. Netlify gives you a URL like `https://random-name.netlify.app`.
4. Open that URL on your Android phone in Chrome.
5. Chrome will show "Install app" in its menu (⋮) OR a prompt at the top. Tap **Install**.
6. The app appears on your home screen with its own icon — open it and it runs fullscreen, no browser bar.

Other free options that work the same way: **Vercel** (https://vercel.com), **Cloudflare Pages**, **GitHub Pages**, **Firebase Hosting**.

### Option B — Test locally on your computer first

If you want to try it on your laptop before hosting:
```bash
cd freight-pwa
python3 -m http.server 8000
```
Then open http://localhost:8000 in Chrome on your laptop. (Service worker registration works on `localhost` without HTTPS.)

### Option C — Run on phone via local network (for testing)

1. On your computer (same Wi-Fi as your phone), run a local HTTPS server. Easiest: use `ngrok` (https://ngrok.com — free, gives you a temporary public HTTPS URL).
   ```bash
   python3 -m http.server 8000     # in the freight-pwa folder
   ngrok http 8000                  # in a separate terminal
   ```
2. ngrok prints a URL like `https://abc123.ngrok-free.app`. Open it on your phone, install from Chrome menu.

---

## 🔧 How to use the app

- **Add entry** — tap the floating **+ Add Entry** button. Fill in transporter, receiver, nags, pheras, amount; toggle "Freight paid" if already received; tap **Save entry**.
- **Edit / delete** — tap any entry card. The same form opens with a delete button at the bottom.
- **Mark paid quickly** — every entry card has a toggle in the bottom-right corner. Tap it to flip paid/unpaid instantly without opening the editor.
- **Search & filter** — type in the search box to find by transporter or receiver. Use the dropdown to show only paid or only pending entries.
- **Statistics** — tap the Statistics tab to see total trips, total pheras, total nags, and paid count for the current month. Use the ←/→ arrows to view past months. Includes a daily bar chart and a list of your top transporters.

## 🌙 Dark mode

The app automatically follows your phone's system theme. Switch your phone to dark mode and the app follows.

## 💾 Backing up your data

Data lives in your phone's browser storage. To export, open the app in Chrome → tap ⋮ → DevTools (if available) → Application → Local Storage. Or ask me to add an export-to-JSON button — it's a 5-minute addition.

## ⚠️ Notes

- Clearing your browser data or uninstalling the PWA deletes all entries. Back up periodically if your records matter.
- The app works fully offline once installed — open it on a plane, log entries, everything keeps working. Data stays on your device.

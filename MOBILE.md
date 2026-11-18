# KMR eSports — Mobile Roadmap

The app is a full-stack Next.js web app. This is the recommended path to Android → iOS → store listings, cheapest first.

---

## Phase 1 — PWA (done in this repo ✅)

Already implemented: `manifest.webmanifest`, maskable icons, service worker (`/sw.js`), Apple meta tags.

**Try it:** open the deployed HTTPS URL in Chrome on Android → menu → **Add to Home screen** / **Install app**. On iOS Safari → Share → **Add to Home Screen**.

> PWA install prompts only work on a public HTTPS deployment (e.g. Vercel), not on localhost.

---

## Phase 2 — Android on Google Play via TWA (no rewrite)

A Trusted Web Activity packages the PWA as a real Android app (full-screen, no browser UI) using [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap):

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR-DOMAIN/manifest.webmanifest
# package id: gg.kmr.esports  (already matched in public/.well-known/assetlinks.json)
bubblewrap build        # produces app-release-signed.aab
```

Then:
1. Create a Google Play Console account ($25 one-time).
2. Create the app → upload the `.aab`.
3. In Play Console → **Setup → App integrity**, copy your **Play App Signing SHA-256 fingerprint** into `public/.well-known/assetlinks.json` and redeploy the site (this is what removes the browser address bar).
4. Fill content rating (**18+** — paid contests), data-safety form, and a privacy policy URL.

### ⚠️ Real-money gaming policy (important)
KMR charges entry fees with cash prizes → Google classifies this as **real-money gaming**. For India you must complete Play's **RMG application/declaration** in the console, geo-block states where paid contests are restricted, and mark the app 18+. Apple has the equivalent rules under App Store guideline **5.3 (Gaming, Gambling, Lotteries)**. Budget review time for this — it's the slowest part of store approval, not the code.

---

## Phase 3 — Capacitor wrapper (real native shell, push notifications)

When you want native features (FCM push for "room ID dropped" alerts, haptics, share sheet):

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "KMR eSports" gg.kmr.esports
npx cap add android
```

In `capacitor.config.ts` point the shell at the live deployment:

```ts
const config = {
  appId: "gg.kmr.esports",
  appName: "KMR eSports",
  server: { url: "https://YOUR-DOMAIN", cleartext: false },
};
```

> Why `server.url`: KMR is a full-stack app (API routes, server components, auth, payments), so it can't be static-exported into the WebView. The shell loads the hosted app — same pattern as Discord/Notion's web-backed screens.

Then `npx cap open android` → build in Android Studio → upload `.aab` to Play Console (same listing as Phase 2, or replace the TWA).

---

## Phase 4 — iOS

```bash
npx cap add ios
npx cap open ios   # requires a Mac with Xcode
```

- Apple Developer Program: **$99/year**.
- Razorpay web checkout is fine for entry fees (RMG purchases are exempt from Apple's IAP requirement, but declare RMG per guideline 5.3).
- App Review dislikes bare wrappers (guideline 4.2) — add the Capacitor push + haptics plugins from Phase 3 and you're fine.

---

## TL;DR order of operations

1. Deploy web app to Vercel (HTTPS) → installable PWA immediately
2. Bubblewrap TWA → Google Play (Android first, as you wanted)
3. Capacitor + FCM push → upgrade the Android listing, then `cap add ios` on a Mac → App Store
4. Only consider an Expo/React Native rewrite if store friction or UX demands it — your backend (`/api/*`) carries over unchanged either way

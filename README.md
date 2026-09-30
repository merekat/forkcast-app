# Forkcast

A small web app that answers one recurring question: *where should we eat tonight?*

Forkcast keeps a private list of the restaurants you actually go to, remembers what you ordered and how good it was, and suggests five places whenever you can't decide. It is built for two people sharing one list.

Cooked up by **Merekat** — because deciding where to eat shouldn't take longer than eating.

---

## Features

**Suggestions**
- Five suggestions per roll, weighted by rating, how long ago you were there, and how good the best dishes are
- Mood filter: tap a tag once to prefer it, twice to exclude it, three times to clear
- Area filter: pick where you are right now; restaurants elsewhere are pushed far down
- Each suggestion shows up to three best dishes and three to avoid
- **Not today** drops one suggestion for the rest of the day and pulls in a replacement
- Restaurants with a day off are hidden automatically

**Restaurants**
- Name, area, Google Maps link, tags, traits, closing days and a free-text note
- Visits with date, rating (1–5) and the dishes you had
- Dishes are tracked per person and shown in separate boxes

**Data**
- Stats: visits this month and year, most visited places, most visited tags, favourite dishes
- Tag and area catalogues you can rename, merge and delete
- Cloud backup via Firebase, JSON export and import

**Everywhere**
- Installable as a PWA on Android and iOS, works offline
- Swipe left and right to move between tabs
- Android back button goes to *Today* first, then leaves the app

---

## Running it

Forkcast is a single static HTML file. No build step, no dependencies to install.

**Locally:** open `index.html` in a browser. Everything works except Google sign-in, which needs a real domain.

**Hosted (GitHub Pages):**
1. Upload all files to a public repository.
2. *Settings → Pages → Branch `main`, folder `/ (root)` → Save.*
3. The app appears at `https://<user>.github.io/<repo>/` after a minute or two.

**Installing on a phone:**
- Android: open the page in Chrome → menu → *Install app*
- iOS: open the page in Safari → Share → *Add to Home Screen*

---

## Cloud sync setup

Sync is optional. Without it, data stays in the browser on one device.

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication** → enable the **Google** provider → add your Pages domain under *Settings → Authorized domains*.
3. **Firestore Database** → create in production mode.
4. **Rules** — replace with the following and publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shared/{docId} {
      allow read, write: if request.auth != null
        && request.auth.token.email in [
          "first@gmail.com",
          "second@gmail.com"
        ];
    }
  }
}
```

5. **Project settings → Your apps → Web** → copy the config into `FIREBASE_CONFIG` near the bottom of `index.html`:

```js
const FIREBASE_CONFIG = {
  apiKey: "…",
  authDomain: "…",
  projectId: "…",
  appId: "…"
};
```

6. If you restrict the API key in Google Cloud, allow **Identity Toolkit API**, **Token Service API** and **Cloud Firestore API**, and add both `<user>.github.io/*` and `<project>.firebaseapp.com/*` as referrers. Leaving out the Token Service API logs you out roughly every hour.

The `apiKey` is meant to be public — access is controlled by the rules above, not by the key.

### Users

The two accounts are hard-coded in `index.html`:

```js
const USERS=[{k:"michel",label:"Michel",mail:"…",pic:"…"},
             {k:"oded",  label:"Oded",  mail:"…",pic:"…"}];
```

The signed-in address decides whose dishes appear on top and who a new dish is attributed to. Profile pictures are embedded as base64 WebP, so there are no extra files to serve.

---

## How suggestions are scored

Every eligible restaurant gets a score:

| Part | Weight |
|---|---|
| Rating (weighted average of recent visits, newest counts most) | 55 % |
| Days since the last visit, capped at 45 days | 25 % |
| Average rating of the three best dishes | 20 % |

Then a few multipliers:

- **Traits**: ±5 % per point, capped at ±35 % overall
- **Visited in the last 7 days**: × 0.3
- **Different area than the one selected**: × 0.05
- **Preferred tags**: restaurants are grouped by how many of your picked tags they match; more matches always rank above fewer

Within each group the pick is weighted random, so the same place does not win every time. Restaurants with no area set never appear.

---

## Sync model

Both devices write to a single Firestore document (`shared/forkcast`). On every change the app **merges** rather than overwrites:

- New restaurants, visits and dishes from either side are kept
- Deletions are recorded in tombstone lists (`deletedRestaurants`, `deletedVisits`, `deletedTags`, `deletedAreas`) so a deleted entry never comes back
- For conflicting edits, the newer `updatedAt` wins for the whole record; without a usable timestamp a fixed, device-independent comparison decides, which guarantees both sides converge
- Everything is serialised canonically (sorted keys and arrays) so two devices holding the same data produce byte-identical output and stop syncing

If two devices keep writing back and forth without gaining anything, sync stops itself and reports that the devices are likely running different versions.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire app: markup, styles, logic, Firebase config |
| `manifest.json` | PWA metadata |
| `sw.js` | Service worker, network-first with offline fallback |
| `icon-*.png` | App icons, including a maskable variant |

Local data lives in `localStorage` under `wohinEssenV1`; dismissed suggestions under `forkcastSkip`.

---

## Updating

1. Replace the changed files in the repository.
2. Bump `APP_VERSION` in `index.html` and `CACHE` in `sw.js`.
3. Reload the app fully on every device.

The version is shown at the bottom of the **Data** tab and must match everywhere, otherwise devices can fight over the same data.

---

## Known limits

- Two users, hard-coded by e-mail address
- Offline edits to the same restaurant on both devices: the newer edit wins entirely, the older one is lost
- Deleting a tag or area globally is remembered; deleting one from a single restaurant follows the usual newer-wins rule
- iOS may clear local storage for web apps left unopened for about a week — the cloud copy is unaffected

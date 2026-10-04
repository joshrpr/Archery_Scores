# Ropers Archery Scorecard

An offline IBO 3D archery scorecard for Android, as an installable web app (PWA). One phone scores a whole group. All data stays on the phone.

## Put it on GitHub Pages (one time, about 5 minutes)

1. Sign in at github.com and click **New repository** (the **+** at top right).
2. Name it, for example `ibo-scorer`, set it to **Public**, and click **Create repository**.
3. On the new repo page, click **uploading an existing file**.
4. Drag in **everything inside** the `ibo-scorer` folder: `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.webmanifest`, `README.md` and the `icons` folder. Click **Commit changes**.
   - Make sure `index.html` sits at the top level of the repo, not inside a sub-folder.
5. Go to **Settings → Pages**. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main** and folder to **/ (root)**, then click **Save**.
6. After a minute or two the page shows your address, for example `https://YOUR-USERNAME.github.io/ibo-scorer/`.

## Install on the Android phone

1. Open that address in **Chrome** (with internet, just this once).
2. Tap **Install app** when Chrome offers it, or use the **⋮ menu → Add to Home screen → Install**.
3. Open it from the new home-screen icon. From now on it works with no signal.

## Updating later

Upload the changed files to the same repo (they replace the old ones). The next time the phone opens the app with a connection, it quietly downloads the new version, and it shows up the time after that.

## Good to know

- Scores, archers and stats are saved only in this app's storage on the phone. Uninstalling the app or clearing Chrome's site data for it erases them. The app asks Android to keep its storage persistent, so automatic cleanup won't remove it.
- Only finished rounds count toward personal bests and stats.
- Tap a score again to clear it. Blank targets count as 0 (miss) when you finish a round.
- The screen stays on while you're on the scoring screen.

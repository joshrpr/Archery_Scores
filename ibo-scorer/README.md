# Ropers Archery Scorecard

An offline IBO 3D and Vegas 300 archery scorecard for Android, as an installable web app (PWA) and as an Android app. One phone scores a whole group. All data stays on the phone.

## Put it on GitHub Pages (one time, about 5 minutes)

The app lives in the `ibo-scorer` folder of the [Archery_Scores](https://github.com/joshrpr/Archery_Scores) repository, so GitHub Pages serves it from that folder.

1. Open the repository on github.com and go to **Settings → Pages**.
2. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main** and folder to **/ (root)**, then click **Save**.
3. After a minute or two the app is live at **`https://joshrpr.github.io/Archery_Scores/ibo-scorer/`**. Note the `/ibo-scorer/` on the end: the repository root (`https://joshrpr.github.io/Archery_Scores/`) is the download page for the Android app, the one to share with friends and family.

To use your own copy instead, fork the repository and follow the same steps; the address becomes `https://YOUR-USERNAME.github.io/Archery_Scores/ibo-scorer/`.

## Install on the Android phone

1. Open that address in **Chrome** (with internet, just this once).
2. Tap **Install app** when Chrome offers it, or use the **⋮ menu → Add to Home screen → Install**.
3. Open it from the new home-screen icon. From now on it works with no signal.

## Updating later

Commit the changed files to the `ibo-scorer` folder on the `main` branch (they replace the old ones). There is no version number to bump. Whenever the app is opened or brought back to the screen with a connection (and every half hour while it stays open), it checks for changed files, downloads them, and reloads itself into the new version. It waits to reload until it is safe: never while a dialog is open, the new-round form is being filled in, or a finger is on the screen. GitHub Pages can take a minute or two to publish a commit, and the phone can take up to 10 minutes after that to see it.

If you add a new file to the app, also add it to the `ASSETS` list in `sw.js` so it is available offline.

## Android app

The same app also comes as a real Android app (an APK), built from these files with [Capacitor](https://capacitorjs.com). The web app above keeps working exactly as before; use whichever you like. The app adds the phone's own haptics (a crisp tick on each ring line while plotting, a firmer tap when an arrow is placed, feedback on scoring, undo and finishing a round), a reliable keep-screen-on while scoring, and saves backups and spreadsheets through Android's share menu so they can go straight to Google Drive.

### Install it

1. On the phone, open **https://github.com/joshrpr/Archery_Scores/releases/latest** in Chrome and tap **ropers-archery.apk**.
2. Open the download. Android asks to allow installs from Chrome the first time; allow it, then tap **Install**.
3. The app is called **Ropers Archery** on the home screen.

When a newer version is published, the app shows **A new version of the app is ready** at the top. Tap **Get it**, open the download and tap **Update**. Installing over the top keeps every score. Every APK is signed with the same key for this reason; uninstalling the app instead erases its scores.

### Move your scores from the web app

The app keeps its own storage, separate from the web app's, so scores need moving across once:

1. In the **web app**, tap **Backup and export → Save backup file**, and keep the file somewhere the phone can reach (Downloads is fine, or Google Drive).
2. In the **Android app**, tap **Moving from the web app?** on the home screen (or **Backup and export**), then **Restore from backup file** and pick that file.

Nothing is removed from the web app, so you can keep it as a fallback.

### How it is built

Every push to `main` that changes the app runs the **Android app** workflow in GitHub Actions. It copies `ibo-scorer/` into the Android project, builds the APK and publishes it as a release tagged `android-<build>`. A pull request gets a test build on the **android-preview** pre-release instead, so a change can be tried on the phone before it is merged.

To build on a computer instead, install Node 22, JDK 21 and the Android SDK, then run `npm ci && npm run apk` in the repository root; the APK lands in `android/app/build/outputs/apk/release/`. `npm run sync` then opening the `android` folder in Android Studio works too.

`native.js` holds everything that behaves differently in the app; everything else is shared. The app's icon and splash screen are generated from `assets/` with `npx @capacitor/assets generate --android`. Publishing to the Play Store would need a Google Play developer account and a private signing key; the key in `android/keystore/` is only for sideloading.

## Good to know

- Scores, archers and stats are saved only in this app's storage on the phone. Uninstalling the app or clearing Chrome's site data for it erases them, so save a backup now and then (see below). The app asks Android to keep its storage persistent, so automatic cleanup won't remove it.
- Pick **IBO 3D** or **Vegas 300** when you start a round. Vegas is 10 ends of 3 arrows scored X, 10 to 6 and M; X counts 10 and breaks ties. Tap a score to fill the next arrow, and tap an arrow to clear it.
- In a Vegas round, tap **Plot arrows on the target** to place each arrow where it landed: press near where it hit, slide to fine-tune (slow movements are geared down for precision) while the magnifier above your finger shows the exact spot and score, then lift. Mis-tapped? Tap **Undo** above the target to take back the last arrow you plotted. The end's scores so far stay in view above the target while you plot. The score is filled in for you (an arrow touching a line gets the higher score). The scorecard then shows a shot map of each archer's arrows, coloured from the first end to the last, with a bubble showing where 4 in 5 arrows landed and a **Drop outliers** slider that removes the worst flier one at a time so you can see the group without it. Below it, each end gets its own small face (best and worst ends ringed), with a count of every score and where your 1st, 2nd and 3rd shots tend to land, and the archer page tracks group size over time. You can mix plotted arrows and score buttons, or switch plotting off.
- Tap **Analytics** on the home screen for each archer's dashboard: average and personal best, score trend with a 5-round average, how often each score is shot, end-by-end and arrow-by-arrow averages for Vegas, an arrow-group heat map (dots when there are only a few arrows) with a 4-in-5 bubble for your last 5 rounds against the ones before, a sight drift chart of where each round's centre sat, and the group-size trend, a head-to-head table and recent rounds. Pick the archer, round type and range (last 10, last 25 or all time) at the top; tap or drag on a chart to read exact values.
- Only finished rounds count toward personal bests and stats. Vegas 300 bests are kept separate from IBO bests.
- Tap a score again to clear it. Blank targets count as 0 (miss) when you finish a round.
- The screen stays on while you're on the scoring screen.

## Backup, restore and spreadsheet export

Tap **Backup and export** on the home screen.

- **Save backup file** downloads every archer, round and score as one `.json` file. Copy it somewhere safe, such as Google Drive.
- **Restore from backup file** reads that file back. It shows what the backup holds and asks before replacing what is on the phone. Use it after a reinstall or to move to a new phone.
- **Export scorecards (CSV)** downloads every score as a spreadsheet for Excel or Google Sheets: one row per archer per IBO target, or per Vegas arrow with its plotted spot when it was plotted. A CSV is for reading only and cannot be restored.
- **Import scores from a file** brings in rounds from your old scoring app's spreadsheet export (`.xlsx`, or the same columns saved as `.csv`). It lists every round it found with its end totals, asks whose scores they are, and adds them alongside what is already on the phone; nothing is replaced. Only Vegas 300 rounds are imported, and anything else in the file is listed as skipped with the reason. A round the old app stopped part way is saved unfinished, so it does not count toward averages until you finish or delete it. Importing the same file twice skips rounds already brought in.

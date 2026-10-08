# Ropers Archery Scorecard

An offline IBO 3D and Vegas 300 archery scorecard for Android, as an installable web app (PWA). One phone scores a whole group. All data stays on the phone.

## Put it on GitHub Pages (one time, about 5 minutes)

The app lives in the `ibo-scorer` folder of the [Archery_Scores](https://github.com/joshrpr/Archery_Scores) repository, so GitHub Pages serves it from that folder.

1. Open the repository on github.com and go to **Settings → Pages**.
2. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main** and folder to **/ (root)**, then click **Save**.
3. After a minute or two the app is live at **`https://joshrpr.github.io/Archery_Scores/ibo-scorer/`**. Note the `/ibo-scorer/` on the end: the repository root has no app of its own.

To use your own copy instead, fork the repository and follow the same steps; the address becomes `https://YOUR-USERNAME.github.io/Archery_Scores/ibo-scorer/`.

## Install on the Android phone

1. Open that address in **Chrome** (with internet, just this once).
2. Tap **Install app** when Chrome offers it, or use the **⋮ menu → Add to Home screen → Install**.
3. Open it from the new home-screen icon. From now on it works with no signal.

## Updating later

Commit the changed files to the `ibo-scorer` folder on the `main` branch (they replace the old ones). There is no version number to bump. Whenever the app is opened or brought back to the screen with a connection (and every half hour while it stays open), it checks for changed files, downloads them, and reloads itself into the new version. It waits to reload until it is safe: never while a dialog is open, the new-round form is being filled in, or a finger is on the screen. GitHub Pages can take a minute or two to publish a commit, and the phone can take up to 10 minutes after that to see it.

If you add a new file to the app, also add it to the `ASSETS` list in `sw.js` so it is available offline.

## Good to know

- Scores, archers and stats are saved only in this app's storage on the phone. Uninstalling the app or clearing Chrome's site data for it erases them, so save a backup now and then (see below). The app asks Android to keep its storage persistent, so automatic cleanup won't remove it.
- Pick **IBO 3D** or **Vegas 300** when you start a round. Vegas is 10 ends of 3 arrows scored X, 10 to 6 and M; X counts 10 and breaks ties. Tap a score to fill the next arrow, and tap an arrow to clear it.
- In a Vegas round, tap **Plot arrows on the target** to place each arrow where it landed: press near where it hit, slide to fine-tune (slow movements are geared down for precision) while the magnifier above your finger shows the exact spot and score, then lift. Mis-tapped? Tap **Undo** under the target to take back the last arrow you plotted. The score is filled in for you (an arrow touching a line gets the higher score). The scorecard then shows each archer's group and how far its centre sits from the middle, and the archer page tracks group size over time. You can mix plotted arrows and score buttons, or switch plotting off.
- Tap **Analytics** on the home screen for each archer's dashboard: average and personal best, score trend with a 5-round average, how often each score is shot, end-by-end and arrow-by-arrow averages for Vegas, a shot map of every plotted arrow with the group centre and group-size trend, a head-to-head table and recent rounds. Pick the archer, round type and range (last 10, last 25 or all time) at the top; tap or drag on a chart to read exact values.
- Only finished rounds count toward personal bests and stats. Vegas 300 bests are kept separate from IBO bests.
- Tap a score again to clear it. Blank targets count as 0 (miss) when you finish a round.
- The screen stays on while you're on the scoring screen.

## Backup, restore and spreadsheet export

Tap **Backup and export** on the home screen.

- **Save backup file** downloads every archer, round and score as one `.json` file. Copy it somewhere safe, such as Google Drive.
- **Restore from backup file** reads that file back. It shows what the backup holds and asks before replacing what is on the phone. Use it after a reinstall or to move to a new phone.
- **Export scorecards (CSV)** downloads every score as a spreadsheet for Excel or Google Sheets: one row per archer per IBO target, or per Vegas arrow with its plotted spot when it was plotted. A CSV is for reading only and cannot be restored.
- **Import scores from a file** brings in rounds from your old scoring app's spreadsheet export (`.xlsx`, or the same columns saved as `.csv`). It lists every round it found with its end totals, asks whose scores they are, and adds them alongside what is already on the phone; nothing is replaced. Only Vegas 300 rounds are imported, and anything else in the file is listed as skipped with the reason. A round the old app stopped part way is saved unfinished, so it does not count toward averages until you finish or delete it. Importing the same file twice skips rounds already brought in.

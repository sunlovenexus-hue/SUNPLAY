# SUNPLAY starter project

Premium black-and-gold music and creative studio prototype for web and Android.

## Included
- Responsive website UI
- Android wrapper configuration using Capacitor
- Local audio-file playback
- Playlist naming
- Lyrics editor with local-device save
- Microphone recording and vocal-file selection
- Music/image/video generation brief builders
- Video-to-MP3 screen placeholder

## Run the website
Open `www/index.html` in a modern browser, or run a local static server from this folder.

## Prepare Android project
1. Install Node.js and Android Studio.
2. In this folder run: `npm install`
3. Run: `npx cap add android`
4. Run: `npx cap sync android`
5. Run: `npx cap open android`
6. In Android Studio, build an APK from the Android project.

## Important production work
This is a starter prototype, not a finished commercial app or a prebuilt APK. AI music/image/video generation requires choosing providers, creating secure server-side integrations, and configuring API credentials. Do not place private API keys in browser code. Reliable video-to-MP3 conversion requires a media-processing integration (for example, a properly licensed FFmpeg service). Add authentication, cloud storage, privacy/consent flows, rate limits, and payment controls before public release.

The browser-based audio player uses files selected on the device. Lyrics are saved in that browser's local storage. This prototype does not upload recordings.


## Build an APK using only an Android phone (cloud build)

You do not need Android Studio on your phone. GitHub Actions can build the APK on a cloud computer.

1. Create or sign in to a GitHub account at https://github.com.
2. In GitHub, create a **new public repository** named `sunplay` (public repositories can use standard GitHub-hosted Actions runners without needing a paid plan; GitHub's current limits and terms apply).
3. On the repository page, choose **Add file → Upload files** and upload the contents of this `SUNPLAY` folder. Make sure `package.json`, `capacitor.config.ts`, `README.md`, `www`, and the hidden `.github/workflows/android-apk.yml` workflow are included. If the mobile upload page hides `.github`, create the workflow manually using **Add file → Create new file**, name it `.github/workflows/android-apk.yml`, and paste the contents from the supplied `android-apk.yml` file.
4. Commit the files to the `main` branch.
5. Open the repository's **Actions** tab. Select **Build SUNPLAY Android APK**, then **Run workflow** if it has not already started.
6. Wait for the workflow to finish successfully. Open the completed run, scroll to **Artifacts**, and download `SUNPLAY-debug-APK`.
7. Extract that downloaded artifact ZIP. Inside it you will find `app-debug.apk`. Tap it to install. Android may ask you to allow installation from that browser or file manager; only allow this for the APK you built from your own repository.

This produces a **debug/testing APK**, not a signed Play Store release. The prototype still needs AI service integrations and production hardening before public launch. Keep API secrets out of the app source and repository.

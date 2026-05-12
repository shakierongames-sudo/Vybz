# Android Wrapper Setup

Vybz is ready to be wrapped as an Android Trusted Web Activity after the public site is deployed and verified.

## Recommended App Details

- App name: Vybz
- Package name: `com.vybz.app`
- Start URL: `https://vybz-app.netlify.app/`
- Manifest URL: `https://vybz-app.netlify.app/manifest.webmanifest`
- Display mode: standalone
- Scope: `/`

## Current PWA Readiness

- `public/manifest.webmanifest` declares `name`, `short_name`, `start_url`, `scope`, `display`, `theme_color`, and `background_color`.
- The manifest includes 192x192 and 512x512 app icons, plus maskable icon entries.
- `index.html` links the web manifest.
- `public/_redirects` keeps React routes working on Netlify with `/* /index.html 200`.
- `public/sw.js` clears old caches on activation so old bundles are not held forever.
- The app root route shows a visible loading state, routes logged-out users to the welcome/login flow, routes users without profiles to onboarding, and routes users with profiles to the feed.

## Bubblewrap / TWA Overview

Trusted Web Activity lets a small Android app open the Vybz PWA full-screen using the user's Android browser. Bubblewrap generates that Android project from the hosted web manifest.

Typical flow:

1. Install Node.js and the Android development tools.
2. Install Bubblewrap.
3. Run Bubblewrap init against `https://vybz-app.netlify.app/manifest.webmanifest`.
4. Use `com.vybz.app` as the package name.
5. Build and test the Android package.
6. Add Digital Asset Links after the signing key is final.
7. Build an Android App Bundle for Google Play.

Do not generate the wrapper until the production Netlify URL, manifest, and signing plan are final.

## Digital Asset Links

Digital Asset Links prove that `https://vybz-app.netlify.app` and the Android app belong together. Without this verification, Android may open Vybz as a Custom Tab with browser UI instead of a full Trusted Web Activity.

After Bubblewrap creates the app and you know the signing certificate fingerprint, create:

```text
public/.well-known/assetlinks.json
```

That file must include:

- package name: `com.vybz.app`
- SHA-256 certificate fingerprint from the signing key
- relationship: `delegate_permission/common.handle_all_urls`

Deploy it to:

```text
https://vybz-app.netlify.app/.well-known/assetlinks.json
```

## Signing Key Warning

The signing key matters. The SHA-256 fingerprint in `assetlinks.json` must match the key used to sign the Android app that users install.

If Google Play App Signing is enabled, Google may use an app signing certificate that is different from the local upload key. Use the Play Console app signing certificate fingerprint for the production `assetlinks.json`.

Keep keystore files private and backed up. Losing the signing key can block future updates.

## Google Play AAB Note

Google Play generally expects an Android App Bundle (`.aab`) for new app uploads. Bubblewrap can build Android output that can be prepared for Play once the signing key and Digital Asset Links are correct.

Before Play submission, confirm:

- Vybz opens full-screen without browser UI.
- Email/password sign-in works.
- Google sign-in redirects back to the app.
- New users complete onboarding.
- Posting, ratings, follows, activity, sounds, and admin checks still work.
- The Play listing explains that Vybz is a social posting and rating app.
- Safety, reporting, blocking, and account deletion request flows are easy to find.

## Testing Checklist

- Open `https://vybz-app.netlify.app/` in a normal browser while logged out and confirm the welcome/login flow appears.
- Log in with an account that has a profile and confirm `/` redirects to `/feed`.
- Log in with a new account without a profile and confirm `/` redirects to `/onboarding`.
- Install the PWA from Chrome and confirm launch opens the same root flow.
- Confirm `https://vybz-app.netlify.app/manifest.webmanifest` loads and includes the Vybz icon entries.
- Confirm `https://vybz-app.netlify.app/icons/icon-192.svg` and `https://vybz-app.netlify.app/icons/icon-512.svg` load.
- Confirm `https://vybz-app.netlify.app/icons/maskable-192.svg` and `https://vybz-app.netlify.app/icons/maskable-512.svg` load.
- After creating the Android wrapper, install it on a real Android device and confirm it does not show browser UI.
- If browser UI appears, verify Digital Asset Links and the signing certificate fingerprint.

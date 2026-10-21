# Android app (Capacitor)

The Android app packages the existing React frontend. It continues to use the existing HTTPS CRM API; it does not connect directly to PostgreSQL and does not require a database migration.

## Safety

- Work on `feature/android-app`; do not deploy this branch to production.
- The workflow builds a debug APK only. It does not deploy anything to the server.
- Before testing against live data, ensure the backend's `CORS_ORIGIN` allows the Capacitor Android origin used by the installed app (normally `https://localhost`) alongside the existing website origin. Change only that environment variable if needed; do not change the database.
- Confirm `https://tailorshopcrm.com` is the correct production site before installing/testing. The GitHub Actions workflow can be configured with repository variable `VITE_API_BASE_URL` if the production API uses another origin.

## Build an APK in GitHub

1. Open **Actions** in the repository.
2. Select **Build Android APK** and click **Run workflow**.
3. When it finishes, download the `tailoring-crm-debug-apk` artifact.
4. Extract the ZIP and transfer `app-debug.apk` to your Android phone.
5. Allow installation from that file source when Android asks, then install.

The workflow is for internal testing. Do not publish a debug APK on Google Play.

## Local build (optional)

Install Node.js 20, Java 21, Android Studio and the Android SDK, then:

```bash
cd frontend
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio, choose **Build > Build Bundle(s) / APK(s) > Build APK(s)** for a test APK.

## Before Google Play

- Add final app icon, screenshots, privacy policy and store listing.
- Review app permissions and data-safety disclosures.
- Verify login/session behavior, invoice PDF/share, image uploads, back navigation and offline/error states on real devices.
- Configure a release signing key securely; never commit it or its passwords.
- Build a signed Android App Bundle (.aab), meet current Play target-API requirements, and complete Play Console testing/review.
- Ensure the app offers sufficient mobile value and complies with Google Play policies; a thin website wrapper may not be accepted as a standalone app.

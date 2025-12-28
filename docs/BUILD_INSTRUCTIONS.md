# Almans App - Build Instructions

Complete guide for building the Almans app for all platforms.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Git**
3. Export project to GitHub from Lovable

---

## 📱 Mobile Apps (Android & iOS)

### Setup (One-time)

```bash
# Clone from your GitHub
git clone https://github.com/YOUR_USERNAME/almans.git
cd almans

# Install dependencies
npm install

# Add mobile platforms
npx cap add android
npx cap add ios
```

### Build & Run

```bash
# Build the web app
npm run build

# Sync with native projects
npx cap sync

# Open in IDE
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode (Mac only)
```

### Android APK/AAB

1. Open project in Android Studio: `npx cap open android`
2. Go to **Build → Generate Signed Bundle/APK**
3. Create or select a keystore
4. Choose **APK** for direct install or **AAB** for Play Store
5. Find output in `android/app/build/outputs/`

### iOS App

1. Open project in Xcode: `npx cap open ios`
2. Select your Team in Signing & Capabilities
3. **Product → Archive** to create app bundle
4. **Distribute App** for App Store or Ad Hoc distribution

---

## 💻 Desktop Apps (Windows, Mac, Linux)

### Setup

```bash
# After cloning, install dependencies
npm install
```

### Development Mode

```bash
# Run in development with hot reload
npm run dev

# In another terminal, start Electron
npx electron electron/main.js
```

### Build Desktop Apps

```bash
# Build web app first
npm run build

# Build for current platform
npx electron-builder

# Build for specific platform
npx electron-builder --win      # Windows (.exe)
npx electron-builder --mac      # macOS (.dmg)
npx electron-builder --linux    # Linux (.AppImage)
```

### Output Locations

- **Windows**: `electron-dist/Almans-{version}-win-x64.exe`
- **macOS**: `electron-dist/Almans-{version}-mac-arm64.dmg`
- **Linux**: `electron-dist/Almans-{version}-linux-x64.AppImage`

---

## 🌐 Web App (PWA)

The web app is automatically a Progressive Web App (PWA).

### Deploy Options

1. **Lovable Publish** (Recommended)
   - Click "Publish" in Lovable interface
   - Get instant shareable URL

2. **Custom Hosting**
   ```bash
   npm run build
   # Upload `dist/` folder to any static host
   ```

### PWA Installation

Users can install the PWA from browser:
- **Chrome/Edge**: Click install icon in address bar
- **Safari iOS**: Share → Add to Home Screen
- **Android Chrome**: Menu → Add to Home Screen

---

## 📋 Quick Reference

| Platform | Command | Output |
|----------|---------|--------|
| Web (dev) | `npm run dev` | http://localhost:5173 |
| Web (build) | `npm run build` | `dist/` folder |
| Android | `npx cap open android` | Android Studio project |
| iOS | `npx cap open ios` | Xcode project |
| Windows | `npx electron-builder --win` | `.exe` installer |
| macOS | `npx electron-builder --mac` | `.dmg` installer |
| Linux | `npx electron-builder --linux` | `.AppImage` |

---

## 🔧 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules
npm install
```

### Capacitor sync issues
```bash
npx cap sync --force
```

### Electron not starting
```bash
# Make sure web app is built first
npm run build
npx electron electron/main.js
```

### iOS signing issues
- Ensure you have an Apple Developer account
- Select your Team in Xcode → Signing & Capabilities

### Android SDK issues
- Open Android Studio → SDK Manager
- Install required SDK versions (API 33+)

---

## 📦 App Distribution

### Google Play Store
1. Generate signed AAB from Android Studio
2. Create developer account ($25 one-time)
3. Upload to Play Console

### Apple App Store
1. Archive from Xcode
2. Create developer account ($99/year)
3. Submit via App Store Connect

### Windows/Mac (Self-distribution)
1. Build with electron-builder
2. Host on your website
3. Users download and install directly

---

## 🎨 Customizing App Icons

1. Replace `public/app-icon.jpg` with your icon (1024x1024)
2. For Android adaptive icons, see Capacitor docs
3. For iOS, use Xcode asset catalog
4. For Electron, update `electron-builder.json` icon paths

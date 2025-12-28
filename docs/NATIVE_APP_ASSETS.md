# Native App Icons and Splash Screens

This document explains how to set up app icons and splash screens for the native iOS and Android apps.

## Prerequisites

After running `npx cap add ios` and `npx cap add android`, you'll need to add your icons and splash screens.

## Recommended Tool

The easiest way to generate all required icon sizes is to use **@capacitor/assets**:

```bash
npm install --save-dev @capacitor/assets
```

Then create a `resources` folder with your source images:

```
resources/
├── icon-only.png          # App icon (1024x1024 recommended)
├── icon-foreground.png    # Android adaptive icon foreground
├── icon-background.png    # Android adaptive icon background
├── splash.png             # Splash screen (2732x2732 recommended)
└── splash-dark.png        # Dark mode splash screen (optional)
```

Generate all icons and splash screens:

```bash
npx capacitor-assets generate
```

## Manual Setup

### iOS Icons (ios/App/App/Assets.xcassets/AppIcon.appiconset/)

Required sizes:
- 20x20 (1x, 2x, 3x)
- 29x29 (1x, 2x, 3x)
- 40x40 (1x, 2x, 3x)
- 60x60 (2x, 3x)
- 76x76 (1x, 2x)
- 83.5x83.5 (2x)
- 1024x1024 (App Store)

### Android Icons (android/app/src/main/res/)

Place icons in these folders:
- mipmap-mdpi (48x48)
- mipmap-hdpi (72x72)
- mipmap-xhdpi (96x96)
- mipmap-xxhdpi (144x144)
- mipmap-xxxhdpi (192x192)

### Splash Screens

#### iOS (ios/App/App/Assets.xcassets/Splash.imageset/)
- Single @1x, @2x, @3x images

#### Android (android/app/src/main/res/drawable/)
- splash.xml for vector drawables
- Or bitmap images in drawable folders

## Using Your Almans Logo

The app uses the Almans wolf logo. Copy your logo to the resources folder:

```bash
# Copy your logo
cp src/assets/almans-wolf-icon.jpg resources/icon-only.png
```

Then convert to PNG and resize to 1024x1024 for best results.

## Capacitor Config

The splash screen is configured in `capacitor.config.ts`:

```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    launchAutoHide: true,
    backgroundColor: '#FAF8F5',
    showSpinner: true,
    spinnerColor: '#C9A45C',
    splashFullScreen: true,
    splashImmersive: true,
  },
}
```

## Testing

After setting up icons and splash screens:

1. Run `npx cap sync` to sync changes
2. Open the native project: `npx cap open ios` or `npx cap open android`
3. Build and run on a device or emulator

## Tips

- Use a square icon without transparency for iOS
- For Android adaptive icons, keep important content in the center 66% of the image
- Test on multiple device sizes to ensure splash screen looks good

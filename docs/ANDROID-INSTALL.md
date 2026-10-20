# Install the Android app on a phone

This guide builds the native Android debug app, installs it on a connected
Android phone, and optionally launches it. Commands are for Windows PowerShell.

## Prerequisites

1. Enable Developer options on the phone: open **Settings** > **About phone**
   and tap **Build number** seven times.
2. In **Developer options**, enable **USB debugging**. Enable **Install via
   USB** too if your device provides that option.
3. Connect the phone to the computer with a USB cable. When prompted, allow USB
   debugging on the phone.
4. Install the Android SDK (including Android SDK Platform-Tools) and JDK 17.
   The commands below assume the SDK is at
   `"$env:LOCALAPPDATA\Android\Sdk"`.
5. Run the commands from the root of a Vector repository checkout.

## 1. Locate ADB and configure the Android SDK

```powershell
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdk\platform-tools\adb.exe"
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
```

If `adb` is already on your `PATH`, you can use `adb` instead of `& $adb`.

## 2. Verify the phone is detected

```powershell
& $adb devices
```

The device should appear with the status `device`:

```text
List of devices attached
<device-serial-number>    device
```

If the status is `unauthorized`, unlock the phone and accept the USB debugging
prompt, then run `& $adb devices` again.

## 3. Build the debug APK

```powershell
Push-Location "ui\android"
.\gradlew.bat assembleDebug
Pop-Location
```

The APK is generated at
`ui\android\app\build\outputs\apk\debug\app-debug.apk`.

The debug build uses `ui\android\debug.keystore`, which is intentionally
excluded from Git. If the build reports that this file is missing, copy your
standard Android debug keystore into place:

```powershell
Copy-Item "$env:USERPROFILE\.android\debug.keystore" "ui\android\debug.keystore"
```

Android Studio can generate the standard debug keystore if it does not exist.
Do not use a debug keystore for a production release.

## 4. Install the APK

```powershell
& $adb install -r -d "ui\android\app\build\outputs\apk\debug\app-debug.apk"
```

- `-r` reinstalls the app and keeps its data.
- `-d` allows installing an APK with a lower version code.

The expected result is `Success`.

## 5. Launch the app (optional)

```powershell
& $adb shell monkey -p com.aistudio.vector.cloudsec -c android.intent.category.LAUNCHER 1
```

To verify that Android has the app installed:

```powershell
& $adb shell pm path com.aistudio.vector.cloudsec
```

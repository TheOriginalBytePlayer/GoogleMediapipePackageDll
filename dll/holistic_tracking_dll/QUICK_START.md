# Quick Start Guide - Visual Studio Build

This is a quick reference for building the HolisticTracking DLL with Visual Studio.

For detailed information, see [README_VS_PROJECT.md](README_VS_PROJECT.md)

## Prerequisites Checklist

- [ ] Visual Studio 2019 or later installed
- [ ] MediaPipe built with Bazel on Windows
- [ ] `MEDIAPIPE_ROOT` environment variable set

## Quick Build Steps

### 1. Set Environment Variable

Open Command Prompt as Administrator and run:
```cmd
setx MEDIAPIPE_ROOT "C:\path\to\your\mediapipe" /M
```

Or set it in System Environment Variables:
- Right-click "This PC" → Properties → Advanced System Settings
- Environment Variables → System Variables → New
- Variable name: `MEDIAPIPE_ROOT`
- Variable value: `C:\path\to\your\mediapipe`

### 2. Open the Solution

Double-click `HolisticTrackingDll.sln` or open it from Visual Studio:
```
File → Open → Project/Solution → Navigate to HolisticTrackingDll.sln
```

### 3. Select Configuration

In Visual Studio toolbar:
- Configuration: `Release` (or `Debug`)
- Platform: `x64` (or `Win32`)

### 4. Build

Press `Ctrl+Shift+B` or:
```
Build → Build Solution
```

### 5. Find Output

The DLL will be created at:
```
dll/holistic_tracking_dll/bin/[Platform]/[Configuration]/MediapipeHolisticTracking.dll
```

Example: `dll/holistic_tracking_dll/bin/x64/Release/MediapipeHolisticTracking.dll`

## Command-Line Build

```cmd
set MEDIAPIPE_ROOT=C:\path\to\your\mediapipe
cd dll\holistic_tracking_dll
msbuild HolisticTrackingDll.sln /p:Configuration=Release /p:Platform=x64
```

## Troubleshooting

### "Cannot open include file: 'mediapipe/...'"

- Verify `MEDIAPIPE_ROOT` is set correctly
- Restart Visual Studio after setting the environment variable
- Ensure MediaPipe is built (check that `%MEDIAPIPE_ROOT%\bazel-mediapipe\external\com_google_absl` directory exists)

### Linker errors

- You may need to add MediaPipe library files to the linker settings
- Check that MediaPipe was built successfully with Bazel
- Verify the build configuration matches your MediaPipe build (Debug/Release, x86/x64)

### Build fails with C++ standard errors

- Ensure Visual Studio 2019 or later is installed
- Check that Windows 10 SDK is installed

## Next Steps

After building:
1. Copy the DLL to your application directory
2. See `../../dll_use_example/MediapipePackageDllTest/` for usage examples
3. Refer to the API in `HolisticTrackingApi.h`

## Getting Help

- Full documentation: [README_VS_PROJECT.md](README_VS_PROJECT.md)
- MediaPipe docs: https://google.github.io/mediapipe/
- Tutorial: https://www.stubbornhuang.com/1919/

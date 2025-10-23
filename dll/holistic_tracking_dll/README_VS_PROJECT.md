# HolisticTrackingDll Visual Studio Project

This Visual Studio project is used to build the Google MediaPipe Holistic Tracking functionality as a DLL (Dynamic Link Library) for Windows.

## Project Files

- **HolisticTrackingDll.sln** - Visual Studio solution file
- **HolisticTrackingDll.vcxproj** - Visual Studio project file

## Source Files Included

The project includes the following source files:

- `HolisticTrackingApi.h/cpp` - Main API interface for the DLL
- `HolisticTrackingDetect.h/cpp` - Core detection implementation
- `GestureRecognition.h/cpp` - Gesture recognition functionality
- `ArmUpAndDownRecognition.h/cpp` - Arm movement detection
- `TrackingDataStructure.h` - Data structures for tracking results

## Prerequisites

Before building this project, you need to:

1. **Install Visual Studio 2019 or later** with C++ development tools
   - Platform Toolset v142 is configured by default
   - Windows 10 SDK is required

2. **Build MediaPipe for Windows**
   - Follow the MediaPipe Windows build instructions
   - The project expects MediaPipe to be built using Bazel
   - Set the `MEDIAPIPE_ROOT` environment variable to point to your MediaPipe installation directory

3. **MediaPipe Dependencies**
   - The project requires access to MediaPipe headers and libraries
   - MediaPipe must be built with the holistic tracking graph dependencies

## Configuration

### Environment Variables

Set the following environment variable before opening the project:

```
MEDIAPIPE_ROOT=C:\path\to\your\mediapipe
```

This variable is used by the project to locate:
- MediaPipe header files: `$(MEDIAPIPE_ROOT)`
- Abseil library headers: `$(MEDIAPIPE_ROOT)/bazel-mediapipe/external/com_google_absl`
- MediaPipe libraries: `$(MEDIAPIPE_ROOT)/bazel-bin`

### Build Configurations

The project supports the following configurations:

- **Debug|Win32** - 32-bit debug build
- **Release|Win32** - 32-bit release build
- **Debug|x64** - 64-bit debug build
- **Release|x64** - 64-bit release build

### Output

The DLL will be built to:
```
dll/holistic_tracking_dll/bin/[Platform]/[Configuration]/MediapipeHolisticTracking.dll
```

Where:
- `[Platform]` is either `Win32` or `x64`
- `[Configuration]` is either `Debug` or `Release`

## Building the Project

### Using Visual Studio IDE

1. Set the `MEDIAPIPE_ROOT` environment variable
2. Open `HolisticTrackingDll.sln` in Visual Studio
3. Select your desired configuration (Debug/Release) and platform (x86/x64)
4. Build → Build Solution (or press Ctrl+Shift+B)

### Using MSBuild Command Line

```cmd
set MEDIAPIPE_ROOT=C:\path\to\your\mediapipe
msbuild HolisticTrackingDll.sln /p:Configuration=Release /p:Platform=x64
```

## Important Notes

1. **MediaPipe Build Required**: This project requires MediaPipe to be pre-built with Bazel. The project references MediaPipe headers and expects Bazel-generated files to be present.

2. **Preprocessor Definitions**: The project defines:
   - `EXPORT` - Enables DLL export declarations
   - `HOLISTICTRACKINGDLL_EXPORTS` - Marks functions for DLL export
   - `_WINDOWS` and `_USRDLL` - Standard Windows DLL definitions

3. **C++ Standard**: The project uses C++17 standard (`stdcpp17`)

4. **Linking**: You may need to add additional MediaPipe library dependencies to the linker settings based on your specific MediaPipe build configuration.

## Troubleshooting

### Cannot find MediaPipe headers

- Ensure `MEDIAPIPE_ROOT` is set correctly
- Verify MediaPipe has been built with Bazel
- Check that `bazel-mediapipe` symlink exists in your MediaPipe directory

### Linker errors about missing symbols

- MediaPipe must be built as a library that can be linked
- You may need to add specific MediaPipe libraries to the Additional Dependencies in project settings
- Refer to the BUILD file for the list of dependencies used by the Bazel build

### Build errors related to protobuf

- Ensure protobuf headers are accessible through MediaPipe's bazel-generated includes
- MediaPipe's Bazel build should include all necessary protobuf files

## Alternative Build Method

This repository primarily uses Bazel for building. The BUILD file in this directory shows the Bazel configuration:

```bash
bazel build //mediapipe/examples/desktop/holistic_tracking_dll:MediapipeHolisticTracking
```

This Visual Studio project is provided as an alternative for developers who prefer to work with Visual Studio or need to integrate the DLL into Visual Studio-based projects.

## For More Information

- [MediaPipe Documentation](https://google.github.io/mediapipe/)
- [MediaPipe Windows Build Guide](https://www.stubbornhuang.com/1555/)
- [HolisticTracking as DLL Tutorial](https://www.stubbornhuang.com/1919/)

## License

This project is part of the GoogleMediapipePackageDll repository. Please refer to the LICENSE file in the root of the repository for licensing information.

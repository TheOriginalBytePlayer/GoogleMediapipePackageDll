# GitHub Actions Workflows

This repository includes GitHub Actions workflows to automatically build the MediaPipe Holistic Tracking library for Windows and macOS.

## Available Workflows

### 1. Build Windows DLL (`build-windows-dll.yml`)

Builds the Windows DLL for the Holistic Tracking functionality.

**Triggers:**
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch
- Manual trigger via GitHub Actions UI

**Artifacts:**
- `MediapipeHolisticTracking-Windows-DLL` - Contains the compiled Windows DLL

**Build Process:**
1. Sets up Windows build environment (Python, Bazel, MSYS2, Visual Studio)
2. Clones MediaPipe v0.8.6
3. Copies `dll/holistic_tracking_dll` source files into MediaPipe
4. Builds the DLL using Bazel
5. Uploads the DLL as a GitHub Actions artifact

**Build Time:** Approximately 60-120 minutes

### 2. Build macOS DyLib (`build-macos-dylib.yml`)

Builds the macOS dynamic library for the Holistic Tracking functionality.

**Triggers:**
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch
- Manual trigger via GitHub Actions UI

**Artifacts:**
- `MediapipeHolisticTracking-macOS-DyLib` - Contains the compiled macOS shared library

**Build Process:**
1. Sets up macOS build environment (Python, Bazel)
2. Clones MediaPipe v0.8.6
3. Copies `dll/holistic_tracking_dll` source files into MediaPipe
4. Builds the shared library using Bazel
5. Uploads the library as a GitHub Actions artifact

**Build Time:** Approximately 60-120 minutes

## Downloading Built Artifacts

After a workflow completes successfully:

1. Go to the **Actions** tab in the GitHub repository
2. Click on the workflow run you're interested in
3. Scroll down to the **Artifacts** section
4. Download the artifact (DLL or DyLib)

Artifacts are retained for 90 days by default.

## Manual Workflow Trigger

You can manually trigger these workflows:

1. Go to the **Actions** tab
2. Select the workflow you want to run (`Build Windows DLL` or `Build macOS DyLib`)
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## Technical Details

### MediaPipe Version

Both workflows use MediaPipe v0.8.6, as specified in the project README. This version is known to work correctly with the code in this repository.

### Build Configuration

- **GPU Support:** Disabled (`--define MEDIAPIPE_DISABLE_GPU=1`)
- **Optimization:** Release build (`-c opt`)
- **Dependencies:** Holistic tracking CPU graph dependencies

### Source Files

The following files from `dll/holistic_tracking_dll/` are included in the build:

- `HolisticTrackingApi.h` / `.cpp` - Main API interface
- `HolisticTrackingDetect.h` / `.cpp` - Core detection implementation
- `GestureRecognition.h` / `.cpp` - Gesture recognition functionality
- `ArmUpAndDownRecognition.h` / `.cpp` - Arm movement detection
- `TrackingDataStructure.h` - Data structures for tracking results
- `BUILD` - Bazel build configuration

## Troubleshooting

### Workflow Fails During Bazel Build

**Common causes:**
- Insufficient disk space or memory on GitHub runners
- Network issues when downloading dependencies
- MediaPipe version incompatibility

**Solutions:**
- Check the workflow logs for specific error messages
- Ensure the MediaPipe version matches what's tested in the repository
- Try re-running the workflow (GitHub runners can occasionally have issues)
- **Note:** Workflows now automatically retry failed network operations and build commands using exponential backoff (see Automatic Retry Logic below)

### Automatic Retry Logic

Both workflows now include automatic retry functionality for improved reliability:

- **Retry Script:** `.github/scripts/retry.sh` provides intelligent retry logic
- **Configurable Attempts:** Defaults to 3 attempts (configurable via `RETRY_MAX`)
- **Exponential Backoff:** Wait times increase exponentially between retries with jitter to avoid thundering herd
- **Retry Coverage:** Network operations (git clone, package downloads), package installations (pip, choco, brew), and build commands (bazel)
- **Error Logging:** Failed commands have their error logs extracted and saved for debugging

This automatic retry logic helps handle transient network failures and temporary resource issues without manual intervention.

### Artifacts Not Found

If the workflow completes but no artifacts are uploaded:
- Check the workflow logs for the "Prepare artifacts" step
- The DLL/library might be in a different location than expected
- The build might have succeeded but with a different output name

### Build Takes Too Long

MediaPipe is a large project and building from source takes time. The workflows have a 120-minute timeout. If builds consistently timeout:
- The GitHub Actions runners may be under heavy load
- Consider using self-hosted runners with more resources
- The MediaPipe version might have increased build times

## Using the Built Libraries

After downloading the artifacts:

### Windows
1. Extract `MediapipeHolisticTracking.dll`
2. Place it in your application's directory
3. See `dll_use_example/` for usage examples

### macOS
1. Extract the shared library file
2. Rename it to have a `.dylib` extension if needed
3. Place it in your application's directory or system library path
4. You may need to adjust library loading paths

## Additional Resources

- [MediaPipe Documentation](https://google.github.io/mediapipe/)
- [MediaPipe Windows Build Guide](https://www.stubbornhuang.com/1555/)
- [HolisticTracking DLL Tutorial](https://www.stubbornhuang.com/1919/)
- [Visual Studio Build Instructions](dll/holistic_tracking_dll/README_VS_PROJECT.md)

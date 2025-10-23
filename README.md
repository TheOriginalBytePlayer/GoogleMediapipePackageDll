# GoogleMediapipePackageDll

This example is based on Mediapipe v0.8.6, the specific version is shown in the following figure:

![mediapipeversion](resource/mediapipeversion.png)

At present, some people report that using the latest version of Mediapipe, the code can be compiled successfully but not run successfully.

Haven't had time to try the latest version of Mediapipe yet, but if you compile with the latest version, you should use the latest version of the model instead of the model in my repository.

## HandTracking Example

![HandTracking](resource/HandTracking.gif)

## HolisticTracking Example
![HolisticTracking](resource/HolisticTracking.gif)

[中文文档](./README-zh.md)

# 1 Project Introduction

The HandTracking and HolisticTracking functions in Google Mediapipe are encapsulated into a dynamic link library, in which dll/hand_tracking_test corresponds to the encapsulation of the HandTracking function, and dll/holistic_tracking_dll corresponds to the encapsulation of the HolisticTracking function.

# 2 Project Structure

- The dll folder contains header files, source files, and build project files for generating dynamic link libraries:
  - Bazel BUILD files for building with Bazel (original build method)
  - Visual Studio solution and project files for building with Visual Studio (see `dll/holistic_tracking_dll/README_VS_PROJECT.md`)
- dll_use_example contains a Visual Studio 2019 project, mainly to demonstrate how to use the above compiled dynamic link library;



# 3 Configuration Tutorial

## 3.1 Compilation tutorial of Mediapipe C++ on Windows

- [ https://www.stubbornhuang.com/1555/]( https://www.stubbornhuang.com/1555/ " https://www.stubbornhuang.com/1555/")

- [https://stubbornhuang.blog.csdn.net/article/details/119546019](https://stubbornhuang.blog.csdn.net/article/details/119546019 "https://stubbornhuang.blog.csdn.net/article/details/119546019")


## 3.2 A tutorial for encapsulating Mediapipe HandTracking as a dll

- [ https://www.stubbornhuang.com/1562/]( https://www.stubbornhuang.com/1562/ " https://www.stubbornhuang.com/1562/")
- [ https://stubbornhuang.blog.csdn.net/article/details/119675282]( https://stubbornhuang.blog.csdn.net/article/details/119675282 " https://stubbornhuang.blog.csdn.net/article/details/119675282")

##  3.3 A tutorial for encapsulating Mediapipe HolisticTracking as a dll

-  [https://www.stubbornhuang.com/1919/](https://www.stubbornhuang.com/1919/)
- [https://blog.csdn.net/HW140701/article/details/122606320](https://blog.csdn.net/HW140701/article/details/122606320)

## 3.4 Building with Visual Studio

Visual Studio project files are now available for the HolisticTracking DLL:

- **Location**: `dll/holistic_tracking_dll/HolisticTrackingDll.sln`
- **Documentation**: See `dll/holistic_tracking_dll/README_VS_PROJECT.md` for detailed build instructions
- **Requirements**: 
  - Visual Studio 2019 or later
  - MediaPipe built with Bazel
  - Set `MEDIAPIPE_ROOT` environment variable

This provides an alternative to Bazel for developers who prefer Visual Studio or need to integrate the DLL into Visual Studio-based projects.


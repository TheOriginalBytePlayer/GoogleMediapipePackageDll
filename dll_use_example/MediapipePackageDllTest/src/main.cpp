#include <iostream> 
#include <opencv2/core/core.hpp> 
#include <opencv2/highgui/highgui.hpp> 
#include <opencv2/opencv.hpp>

#include "MediapipeHandTrackingDll.h"
#include "MediapipeHolisticTrackingDll.h"

std::vector<cv::Point> handKPs(42); // 全局变量保存手部关键点信息
int gValidKpCount = 21;

std::string GetGestureResult(int result)
{
	std::string result_str = "未知手势";
	switch (result)
	{
	case 1:
		result_str = "One";
		break;
	case 2:
		result_str = "Two";
		break;
	case 3:
		result_str = "Three";
		break;
	case 4:
		result_str = "Four";
		break;
	case 5:
		result_str = "Five";
		break;
	case 6:
		result_str = "Six";
		break;
	case 7:
		result_str = "ThumbUp";
		break;
	case 8:
		result_str = "Ok";
		break;
	case 9:
		result_str = "Fist";
		break;

	default:
		break;
	}

	return result_str;
}

std::string GetArmUpAndDownResult(int result)
{
	std::string result_str = "未知";
	switch (result)
	{
	case -1:
		result_str = "未知";
		break;
	case 1:
		result_str = "手臂抬起";
		break;
	case 2:
		result_str = "手臂放下";
		break;

	default:
		break;
	}

	return result_str;
}

// count可能为21或42
// count为42时，先右手，后左手
void LandmarksCallBackImpl(int image_index, PoseInfo* infos, int count)
{
	std::cout << "image_index：" << image_index << std::endl;
	std::cout << "hand joint num：" << count << std::endl;
	gValidKpCount = count;
	if (gValidKpCount > 42) {
		gValidKpCount = 42;
	}
	for (int i = 0; i < count; ++i)
	{
		if (i < 42) {
			handKPs[i] = cv::Point(infos[i].x, infos[i].y);
		}		
	//	float x = infos[i].x;
	//	float y = infos[i].y;

	//	//std::cout << "x=" << x << "," << "y=" << y << endl;
	}
}

void GestureResultCallBackImpl(int image_index, int* recogn_result, int count)
{
	std::cout << "image_index：" << image_index << std::endl;
	for (int i = 0; i < count; ++i)
	{
		std::cout << "第" << i << "只手的识别结果为：" << GetGestureResult(recogn_result[i]) <<std::endl;
	}
}

void DrawHandKeyponts(cv::Mat& srcImage)
{
	// 绘制关键点
	for (int i = 0; i < gValidKpCount; i++) {
		// 使用 cv::circle 函数绘制实心圆来表示点
		cv::circle(srcImage, handKPs[i], 6, cv::Scalar(0, 0, 255), -1);
	}

	int handCount = gValidKpCount / 21;
	int offset = 0;
	// 绘制关键点之间的连线
	cv::Scalar lnColor(0, 255, 0);
	int lnThickness = 2;
	for (int i = 0; i < handCount; i++) {
		cv::line(srcImage, handKPs[offset + 0], handKPs[offset + 1], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 1], handKPs[offset + 2], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 2], handKPs[offset + 3], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 3], handKPs[offset + 4], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 0], handKPs[offset + 5], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 5], handKPs[offset + 6], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 6], handKPs[offset + 7], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 7], handKPs[offset + 8], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 9], handKPs[offset + 10], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 10], handKPs[offset + 11], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 11], handKPs[offset + 12], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 13], handKPs[offset + 14], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 14], handKPs[offset + 15], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 15], handKPs[offset + 16], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 0], handKPs[offset + 17], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 17], handKPs[offset + 18], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 18], handKPs[offset + 19], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 19], handKPs[offset + 20], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 5], handKPs[offset + 9], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 9], handKPs[offset + 13], lnColor, lnThickness);
		cv::line(srcImage, handKPs[offset + 13], handKPs[offset + 17], lnColor, lnThickness);

		offset += 21;
	}
	
}

void HandTrackingDllTest()
{
	MediapipeHandTrackingDll mediapipeHandTrackingDll;
#ifdef _DEBUG
	std::string dll_path = ".././bin/MediapipeTest/x64/Debug/Mediapipe_Hand_Tracking.dll";
#else
	std::string dll_path = "./Mediapipe_Hand_Tracking.dll";
#endif // DEBUG

	mediapipeHandTrackingDll.LoadMediapipeHandTrackingDll(dll_path);
	mediapipeHandTrackingDll.GetAllFunctions();

	/* 初始化Mediapipe Hand Tracking */
#ifdef _DEBUG
	std::string mediapipe_hand_tracking_model_path = ".././bin/MediapipeTest/x64/Debug/hand_tracking_desktop_live.pbtxt";
#else
	std::string mediapipe_hand_tracking_model_path = "./hand_tracking_desktop_live.pbtxt";
#endif // _DEBUG

	if (mediapipeHandTrackingDll.m_Mediapipe_Hand_Tracking_Init(mediapipe_hand_tracking_model_path.c_str()))
	{
		std::cout << "初始化模型成功" << std::endl;
	}
	else
	{
		std::cout << "初始化模型失败" << std::endl;
	}

	// 注册回调函数
	if (mediapipeHandTrackingDll.m_Mediapipe_Hand_Tracking_Reigeter_Landmarks_Callback(LandmarksCallBackImpl))
	{
		std::cout << "注册坐标回调函数成功" << std::endl;
	}
	else
	{
		std::cout << "注册坐标回调函数失败" << std::endl;
	}

	if (mediapipeHandTrackingDll.m_Mediapipe_Hand_Tracking_Register_Gesture_Result_Callback(GestureResultCallBackImpl))
	{
		std::cout << "注册手势识别结果回调函数成功" << std::endl;
	}
	else
	{
		std::cout << "注册手势识别结果回调函数失败" << std::endl;
	}

	/* 1 第一种方式：传入视频路径识别视频中的手势 */

	//std::string test_video_path = "pjd-0028-Ch.mp4";
	//Mediapipe_Hand_Tracking_Detect_Video(test_video_path.c_str(), 1);


	//打开第一个摄像头
	cv::VideoCapture cap(0);
	//判断摄像头是否打开
	if (!cap.isOpened())
	{
		std::cout << "摄像头未成功打开" << std::endl;
	}

	//创建窗口
	cv::namedWindow("现场视频", 1);

	int image_index = 0;
	while (1)
	{
		//创建Mat对象
		cv::Mat frame;
		//从cap中读取一帧存到frame中
		bool res = cap.read(frame);
		if (!res)
		{
			break;
		}

		//判断是否读取到
		if (frame.empty())
		{
			break;
		}

		//深拷贝
		cv::Mat copyMat;
		frame.copyTo(copyMat);
		cv::flip(frame, frame, /*flipcode=HORIZONTAL*/ 1);

		// 浅拷贝
		/*Mat copyMat;
		copyMat = frame;*/

		uchar* pImageData = copyMat.data;


		/* 2 第二种方式：传入视频帧并通过回调函数回调结果 */
		gValidKpCount = 0;
		if (mediapipeHandTrackingDll.m_Mediapipe_Hand_Tracking_Detect_Frame(image_index, copyMat.cols, copyMat.rows, (void*)pImageData))
		{
			if (gValidKpCount > 0) {
				DrawHandKeyponts(frame);
			}				
			//std::cout << "Mediapipe_Hand_Tracking_Detect_Frame执行成功！" << std::endl;
		}
		else
		{
			std::cout << "Mediapipe_Hand_Tracking_Detect_Frame执行失败！" << std::endl;
		}
		//cv::flip(frame, frame, /*flipcode=HORIZONTAL*/ 1);

		/* 3 第三种方式：传入视频帧直接返回手势识别结果，不通过回调函数返回结果 */
		/*GestureRecognitionResult gestureRecognitionResult;
		if (mediapipeHandTrackingDll.m_Mediapipe_Hand_Tracking_Detect_Frame_Direct(copyMat.cols, copyMat.rows, (void*)pImageData, gestureRecognitionResult))
		{
			for (int i = 0; i < 2; ++i)
			{
				if (gestureRecognitionResult.m_Gesture_Recognition_Result[i] != -1)
				{
					std::cout << "第" << i << "只手的手势识别结果为：" << GetGestureResult(gestureRecognitionResult.m_Gesture_Recognition_Result[i]) << std::endl;
				}

				if (gestureRecognitionResult.m_HandUp_HandDown_Detect_Result[i] != -1)
				{
					std::cout << "第" << i << "只手的抬手放手识别结果为：" << GetArmUpAndDownResult(gestureRecognitionResult.m_HandUp_HandDown_Detect_Result[i]) << std::endl;
				}
			}

		}
		else
		{
			std::cout << "Mediapipe_Hand_Tracking_Detect_Frame_Direct执行失败！" << std::endl;
		}*/


		//显示摄像头读取到的图像
		imshow("现场视频", frame);
		//等待1毫秒，如果按键则退出循环
		if (cv::waitKey(1) >= 0)
		{
			break;
		}

		image_index += 1;
	}

	if (mediapipeHandTrackingDll.m_Mediapipe_Hand_Tracking_Release())
	{
		std::cout << "Mediapipe释放成功！" << std::endl;
	}
	else
	{
		std::cout << "Mediapipe释放失败！" << std::endl;
	}


	cap.release();
	cv::destroyAllWindows();

	mediapipeHandTrackingDll.UnLoadMediapipeHandTrackingDll();
}


void HolisticTrackingDllTest()
{
	MediapipeHolisticTrackingDll mediapipeHolisticTrackingDll;

#ifdef _DEBUG
	std::string dll_path = ".././bin/MediapipeTest/x64/Debug/MediapipeHolisticTracking.dll";
#else
	std::string dll_path = "./MediapipeHolisticTracking.dll";
#endif // DEBUG

	mediapipeHolisticTrackingDll.LoadMediapipeHolisticTrackingDll(dll_path);
	mediapipeHolisticTrackingDll.GetAllFunctions();


	/* 初始化Mediapipe Holistic Tracking */
#ifdef _DEBUG
	std::string mediapipe_holistic_tracking_model_path = ".././bin/MediapipeTest/x64/Debug/holistic_tracking_cpu.pbtxt";
#else
	std::string mediapipe_holistic_tracking_model_path = "./holistic_tracking_cpu.pbtxt";
#endif // _DEBUG

	if (mediapipeHolisticTrackingDll.m_MediapipeHolisticTrackingInit(mediapipe_holistic_tracking_model_path.c_str(),true,true,true,true))
	{
		std::cout << "初始化模型成功" << std::endl;
	}
	else
	{
		std::cout << "初始化模型失败" << std::endl;
	}

	/*----- 第一种方式：传图片帧进去识别 -----*/

	//打开第一个摄像头
	cv::VideoCapture cap(0);
	//判断摄像头是否打开
	if (!cap.isOpened())
	{
		std::cout << "摄像头未成功打开" << std::endl;
	}

	//创建窗口
	cv::namedWindow("打开摄像头", 1);

	while (true)
	{
		//创建Mat对象
		cv::Mat frame;
		//从cap中读取一帧存到frame中
		bool res = cap.read(frame);
		if (!res)
		{
			break;
		}

		//判断是否读取到
		if (frame.empty())
		{
			break;
		}

		//深拷贝
		cv::Mat copyMat;
		frame.copyTo(copyMat);

		uchar* pImageData = copyMat.data;
		int* pdetect_result = new int[4];
		if (mediapipeHolisticTrackingDll.m_MediapipeHolisticTrackingDetectFrameDirect(copyMat.cols, copyMat.rows, (void*)pImageData, pdetect_result,true))
		{
			std::string leftArmUpAndDownRecognitionResult = GetArmUpAndDownResult(pdetect_result[0]);
			std::string rightArmUpAndDownRecognitionResult = GetArmUpAndDownResult(pdetect_result[1]);
			std::string leftHandGestureRecognitionResult = GetGestureResult(pdetect_result[2]);
			std::string rightHandGestureRecognitionResult = GetGestureResult(pdetect_result[3]);

			std::cout << "左手抬手放手结果为：" << leftArmUpAndDownRecognitionResult << std::endl;
			std::cout << "右手抬手放手结果为：" << rightArmUpAndDownRecognitionResult << std::endl;
			std::cout << "左手手势为：" << leftHandGestureRecognitionResult << std::endl;
			std::cout << "右手手势为：" << rightHandGestureRecognitionResult << std::endl;
		}
		else
		{
			std::cout << "Mediapipe_Holistic_Tracking_Detect_Frame_Direct执行失败！" << std::endl;
		}
		delete[] pdetect_result;

		//显示摄像头读取到的图像
		imshow("打开摄像头", frame);
		//等待1毫秒，如果按键则退出循环
		if (cv::waitKey(1) >= 0)
		{
			break;
		}
	}

	/*----- 第二种方式：在DLL内部打开摄像头进行识别，主要测试用 -----*/
	//mediapipeHolisticTrackingDll.m_Mediapipe_Holistic_Tracking_Detect_Camera(true);

	if (mediapipeHolisticTrackingDll.m_MediapipeHolisticTrackingRelease())
	{
		std::cout << "Mediapipe释放成功！" << std::endl;
	}
	else
	{
		std::cout << "Mediapipe释放失败！" << std::endl;
	}


	cap.release();
	cv::destroyAllWindows();


	mediapipeHolisticTrackingDll.UnLoadMediapipeHolisticTrackingDll();
}

int main()
{
	HandTrackingDllTest();

	// DLL内部自绘；不会有回调信息
	//HolisticTrackingDllTest();

	getchar();

	return 0;
}
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, CameraOff } from 'lucide-react';
import { PoseLandmarks } from './types';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

interface CameraFeedProps {
  isActive: boolean;
  showOverlay: boolean;
  onPoseDetected: (landmarks: PoseLandmarks, confidence: number, neckAngle?: number) => void;
  onRightFistDetected?: () => void;
  onLeftFistDetected?: () => void;
}

export const CameraFeed = ({ isActive, showOverlay, onPoseDetected, onRightFistDetected, onLeftFistDetected }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const handDetectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const smoothedKeypointsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const lastGestureTimeRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });
  const lastDetectionTimeRef = useRef<number>(0);
  const fpsTargetRef = useRef<number>(1000 / 30); // 30 FPS target

  useEffect(() => {
    if (!isActive) {
      cleanup();
      return;
    }

    initializeCamera();
    return () => cleanup();
  }, [isActive]);

  const initializeCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Starting camera...');

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;

      if (!videoRef.current) throw new Error('Video element not found');

      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      // @ts-ignore - Safari/iOS requires playsInline
      videoRef.current.playsInline = true;

      await new Promise<void>((resolve) => {
        if (!videoRef.current) return resolve();
        videoRef.current.onloadedmetadata = () => resolve();
      });

      await videoRef.current.play();

      console.log('Initializing TensorFlow.js backend...');
      
      // Initialize TensorFlow backend with fallback
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('WebGL backend initialized successfully');
      } catch (err) {
        console.warn('WebGL backend failed, trying cpu backend:', err);
        await tf.setBackend('cpu');
        await tf.ready();
      }

      console.log('Creating MoveNet detector...');

      // Create MoveNet detector with proper configuration for production
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        }
      );

      detectorRef.current = detector;

      console.log('Creating hand detector...');
      const handDetector = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
        {
          runtime: 'tfjs',
          modelType: 'lite',
          maxHands: 2,
        }
      );
      handDetectorRef.current = handDetector;

      console.log('Starting detection loop...');
      detectPose();
      setIsLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setIsLoading(false);
    }
  };

  const isHandRaised = (hand: handPoseDetection.Hand): boolean => {
    const keypoints = hand.keypoints;
    const wrist = keypoints.find(kp => kp.name === 'wrist');
    const indexTip = keypoints.find(kp => kp.name === 'index_finger_tip');
    const middleTip = keypoints.find(kp => kp.name === 'middle_finger_tip');
    const ringTip = keypoints.find(kp => kp.name === 'ring_finger_tip');
    const pinkyTip = keypoints.find(kp => kp.name === 'pinky_tip');

    if (!wrist || !indexTip || !middleTip || !ringTip || !pinkyTip) return false;

    // Hand is raised when fingertips are significantly above (lower Y value) the wrist
    // In screen coordinates, lower Y means higher position
    const fingerTips = [indexTip, middleTip, ringTip, pinkyTip];
    let raisedFingers = 0;
    
    for (const tip of fingerTips) {
      // Check if fingertip is at least 50 pixels above wrist
      if (wrist.y - tip.y > 50) {
        raisedFingers++;
      }
    }

    // Consider hand raised if at least 3 fingers are extended upward
    return raisedFingers >= 3;
  };

  const detectPose = async () => {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      animationRef.current = requestAnimationFrame(detectPose);
      return;
    }

    // Throttle detection to 30 FPS for smoother performance
    const now = performance.now();
    if (now - lastDetectionTimeRef.current < fpsTargetRef.current) {
      animationRef.current = requestAnimationFrame(detectPose);
      return;
    }
    lastDetectionTimeRef.current = now;

    try {
      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      
      if (poses.length > 0) {
        const pose = poses[0];
        drawPose(pose);
        
        // Extract landmarks for posture detection
        const keypoints = pose.keypoints;
        const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
        const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
        const leftHip = keypoints.find(kp => kp.name === 'left_hip');
        const rightHip = keypoints.find(kp => kp.name === 'right_hip');
        const nose = keypoints.find(kp => kp.name === 'nose');
        const leftEar = keypoints.find(kp => kp.name === 'left_ear');

        // Calculate average confidence
        const avgConfidence = keypoints
          .filter(kp => kp.score && kp.score > 0)
          .reduce((acc, kp) => acc + (kp.score || 0), 0) / keypoints.length;

        // Calculate neck angle if face landmarks available
        let neckAngle: number | undefined;
        if (nose && leftEar && leftShoulder && nose.score && leftEar.score && leftShoulder.score) {
          const earToNose = {
            x: nose.x - leftEar.x,
            y: nose.y - leftEar.y,
          };
          const earToShoulder = {
            x: leftShoulder.x - leftEar.x,
            y: leftShoulder.y - leftEar.y,
          };
          
          // Calculate angle between vectors
          const dotProduct = earToNose.x * earToShoulder.x + earToNose.y * earToShoulder.y;
          const mag1 = Math.sqrt(earToNose.x ** 2 + earToNose.y ** 2);
          const mag2 = Math.sqrt(earToShoulder.x ** 2 + earToShoulder.y ** 2);
          neckAngle = Math.acos(dotProduct / (mag1 * mag2)) * (180 / Math.PI);
        }

        if (leftShoulder && rightShoulder && leftHip && rightHip) {
          const poseLandmarks: PoseLandmarks = {
            leftShoulder: { x: leftShoulder.x, y: leftShoulder.y, z: 0 },
            rightShoulder: { x: rightShoulder.x, y: rightShoulder.y, z: 0 },
            leftHip: { x: leftHip.x, y: leftHip.y, z: 0 },
            rightHip: { x: rightHip.x, y: rightHip.y, z: 0 },
          };
          onPoseDetected(poseLandmarks, avgConfidence, neckAngle);
        }
      }

      // Hand gesture detection
      if (handDetectorRef.current && (onRightFistDetected || onLeftFistDetected)) {
        const hands = await handDetectorRef.current.estimateHands(videoRef.current);
        const now = Date.now();
        
        for (const hand of hands) {
          if (isHandRaised(hand)) {
            const isRight = hand.handedness === 'Right';
            const lastTime = isRight ? lastGestureTimeRef.current.right : lastGestureTimeRef.current.left;
            
            // Debounce: only trigger once every 2 seconds
            if (now - lastTime > 2000) {
              if (isRight && onRightFistDetected) {
                console.log('Right hand raised detected');
                onRightFistDetected();
                lastGestureTimeRef.current.right = now;
              } else if (!isRight && onLeftFistDetected) {
                console.log('Left hand raised detected');
                onLeftFistDetected();
                lastGestureTimeRef.current.left = now;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Detection error:', err);
    }

    animationRef.current = requestAnimationFrame(detectPose);
  };

  const drawPose = (pose: poseDetection.Pose) => {
    if (!showOverlay || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Smooth keypoints using exponential moving average for fluid tracking
    const smoothingFactor = 0.5; // Increased for smoother motion
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score && keypoint.score > 0.3) {
        const prev = smoothedKeypointsRef.current.get(keypoint.name || '');
        if (prev) {
          keypoint.x = prev.x * (1 - smoothingFactor) + keypoint.x * smoothingFactor;
          keypoint.y = prev.y * (1 - smoothingFactor) + keypoint.y * smoothingFactor;
        }
        smoothedKeypointsRef.current.set(keypoint.name || '', { x: keypoint.x, y: keypoint.y });
      }
    });

    // Draw skeleton connections with glow effect
    const connections = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
    ];

    connections.forEach(([start, end]) => {
      const startPoint = pose.keypoints.find(kp => kp.name === start);
      const endPoint = pose.keypoints.find(kp => kp.name === end);

      if (startPoint && endPoint && startPoint.score && endPoint.score && 
          startPoint.score > 0.3 && endPoint.score > 0.3) {
        
        // Draw glow effect
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
        
        // Draw main line with gradient
        const gradient = ctx.createLinearGradient(
          startPoint.x, startPoint.y,
          endPoint.x, endPoint.y
        );
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(1, '#00ddff');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff88';
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    });

    // Draw keypoints with pulse effect
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score && keypoint.score > 0.3) {
        // Outer glow
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 0, 136, 0.2)';
        ctx.fill();
        
        // Main point
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        const pointGradient = ctx.createRadialGradient(
          keypoint.x, keypoint.y, 0,
          keypoint.x, keypoint.y, 6
        );
        pointGradient.addColorStop(0, '#ff0088');
        pointGradient.addColorStop(1, '#ff0044');
        ctx.fillStyle = pointGradient;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff0088';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  };

  const cleanup = () => {
    console.log('Cleaning up...');

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (detectorRef.current) {
      detectorRef.current.dispose();
      detectorRef.current = null;
    }

    if (handDetectorRef.current) {
      handDetectorRef.current.dispose();
      handDetectorRef.current = null;
    }
  };

  return (
    <Card className="overflow-hidden bg-card">
      <div className="relative w-full" style={{ paddingTop: '75%' }}>
        <div className="absolute inset-0 bg-secondary flex items-center justify-center">
          {!isActive ? (
            <div className="text-center text-muted-foreground">
              <CameraOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Camera inactive</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover transform-gpu"
                style={{ willChange: 'transform' }}
                playsInline
                autoPlay
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full transform-gpu"
                style={{ willChange: 'transform' }}
                width={640}
                height={480}
              />
              <div className="absolute top-4 right-4 bg-status-good text-status-good-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2">
                <Camera className="w-3 h-3" />
                Live
              </div>

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                  <div className="text-center">
                    <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-muted-foreground">Initializing camera...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute left-4 right-4 bottom-4">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

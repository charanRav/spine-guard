import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, CameraOff } from 'lucide-react';
import { PoseLandmarks } from './types';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

interface CameraFeedProps {
  isActive: boolean;
  showOverlay: boolean;
  onPoseDetected: (landmarks: PoseLandmarks) => void;
}

export const CameraFeed = ({ isActive, showOverlay, onPoseDetected }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

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

      console.log('Initializing MoveNet detector...');

      // Create MoveNet detector - simpler and more accurate
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        }
      );

      detectorRef.current = detector;

      console.log('Starting detection loop...');
      detectPose();
      setIsLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      setIsLoading(false);
    }
  };

  const detectPose = async () => {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      animationRef.current = requestAnimationFrame(detectPose);
      return;
    }

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

        if (leftShoulder && rightShoulder && leftHip && rightHip) {
          const poseLandmarks: PoseLandmarks = {
            leftShoulder: { x: leftShoulder.x, y: leftShoulder.y, z: 0 },
            rightShoulder: { x: rightShoulder.x, y: rightShoulder.y, z: 0 },
            leftHip: { x: leftHip.x, y: leftHip.y, z: 0 },
            rightHip: { x: rightHip.x, y: rightHip.y, z: 0 },
          };
          onPoseDetected(poseLandmarks);
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

    // Draw keypoints
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score && keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0088';
        ctx.fill();
      }
    });

    // Draw skeleton
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

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 4;

    connections.forEach(([start, end]) => {
      const startPoint = pose.keypoints.find(kp => kp.name === start);
      const endPoint = pose.keypoints.find(kp => kp.name === end);

      if (startPoint && endPoint && startPoint.score && endPoint.score && 
          startPoint.score > 0.3 && endPoint.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
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
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                autoPlay
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
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

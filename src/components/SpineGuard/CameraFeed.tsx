import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, CameraOff } from 'lucide-react';
import { PoseLandmarks } from './types';

interface CameraFeedProps {
  isActive: boolean;
  showOverlay: boolean;
  onPoseDetected: (landmarks: PoseLandmarks) => void;
}

declare global {
  interface Window {
    Pose: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

export const CameraFeed = ({ isActive, showOverlay, onPoseDetected }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const poseRef = useRef<any>(null);
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

      // Ensure the <video> element exists even while loading UI is shown
      let guardTries = 0;
      while (!videoRef.current && guardTries < 50) {
        await new Promise(resolve => setTimeout(resolve, 20));
        guardTries++;
      }
      if (!videoRef.current) throw new Error('Video element not found');

      // Attach the stream and wait for metadata
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      // @ts-ignore - Safari/iOS requires playsInline
      videoRef.current.playsInline = true;
      
      await new Promise<void>((resolve) => {
        if (!videoRef.current) return resolve();
        videoRef.current.onloadedmetadata = () => resolve();
      });

      await videoRef.current.play();

      console.log('Video playing, waiting for MediaPipe...');

      // Wait for MediaPipe Pose to load
      let attempts = 0;
      while (!window.Pose && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.Pose) {
        throw new Error('MediaPipe Pose failed to load. Please refresh.');
      }

      console.log('Initializing Pose detector...');

      poseRef.current = new window.Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      poseRef.current.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseRef.current.onResults(onResults);

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
    if (!poseRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      animationRef.current = requestAnimationFrame(detectPose);
      return;
    }

    try {
      await poseRef.current.send({ image: videoRef.current });
    } catch (err) {
      console.warn('Detection error:', err);
    }

    animationRef.current = requestAnimationFrame(detectPose);
  };

  const onResults = (results: any) => {
    if (!results.poseLandmarks) return;

    const landmarks = results.poseLandmarks;

    // Draw overlay
    if (showOverlay && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx && window.drawConnectors && window.drawLandmarks) {
        ctx.save();
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        window.drawConnectors(ctx, landmarks, window.POSE_CONNECTIONS, { color: '#00ff88', lineWidth: 4 });
        window.drawLandmarks(ctx, landmarks, { color: '#ff0088', lineWidth: 2, radius: 6 });
        
        ctx.restore();
      }
    }

    // Send pose data
    if (landmarks.length >= 24) {
      const poseLandmarks: PoseLandmarks = {
        leftShoulder: landmarks[11],
        rightShoulder: landmarks[12],
        leftHip: landmarks[23],
        rightHip: landmarks[24],
      };
      onPoseDetected(poseLandmarks);
    }
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
    
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
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

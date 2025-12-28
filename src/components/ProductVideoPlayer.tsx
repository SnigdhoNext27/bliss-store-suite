import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductVideoPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  className?: string;
}

export function ProductVideoPlayer({ videoUrl, posterUrl, className = '' }: ProductVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // Check if it's a YouTube URL
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  
  if (isYouTube) {
    // Extract video ID
    let videoId = '';
    if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (videoUrl.includes('v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0] || '';
    }

    return (
      <div className={`relative rounded-xl overflow-hidden bg-black ${className}`}>
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            title="Product Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={toggleFullscreen}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <X className="h-6 w-6" />
            </Button>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              className="max-w-full max-h-full"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnd}
              muted={isMuted}
              playsInline
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regular Player */}
      <div 
        className={`relative rounded-xl overflow-hidden bg-black group ${className}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(isPlaying ? false : true)}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          className="w-full aspect-video object-cover cursor-pointer"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnd}
          muted={isMuted}
          playsInline
          onClick={togglePlay}
        />

        {/* Play Button Overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
              >
                <Play className="h-8 w-8 ml-1" fill="currentColor" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
            >
              {/* Progress Bar */}
              <div 
                className="h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

import { useState, useRef } from 'react';

interface ProductImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

export function ProductImageZoom({ src, alt, className = '' }: ProductImageZoomProps) {
  const [isZooming, setIsZooming] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
    setPosition({ x: 50, y: 50 });
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-crosshair ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Base image */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-200"
        style={{ opacity: isZooming ? 0 : 1 }}
      />

      {/* Zoomed image */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: isZooming ? 1 : 0,
          backgroundImage: `url(${src})`,
          backgroundPosition: `${position.x}% ${position.y}%`,
          backgroundSize: '200%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Zoom indicator */}
      {!isZooming && (
        <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-md pointer-events-none">
          Hover to zoom
        </div>
      )}
    </div>
  );
}

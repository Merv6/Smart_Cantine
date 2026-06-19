import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';

interface PhotoGalleryProps {
  photos: string[];
  onZoom?: (photo: string) => void;
}

export const PhotoGallery = ({ photos, onZoom }: PhotoGalleryProps) => {
  const [showPhotos, setShowPhotos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    if (showPhotos) {
      setIsLoading(true);
      // Small delay to ensure skeleton is seen
      const timer = setTimeout(() => {
         // Check if all images are already loaded (cached)
         const allLoaded = photos.every((p) => {
            const img = new Image();
            img.src = p;
            return img.complete;
         });
         
         if (allLoaded) {
           setIsLoading(false);
         }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showPhotos, photos]);

  useEffect(() => {
    if (loadedCount === photos.length && showPhotos) {
      setIsLoading(false);
    }
  }, [loadedCount, photos.length, showPhotos]);

  if (!showPhotos) {
    return (
      <button
        onClick={() => {
          setShowPhotos(true);
          setIsLoading(true);
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
      >
        <Camera size={14} />
        Voir {photos.length} photo{photos.length > 1 ? 's' : ''}
      </button>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="flex gap-2">
          {photos.map((_, i) => (
            <Skeleton key={i} className="w-12 h-12 rounded-lg" />
          ))}
        </div>
      )}
      <div className={`${isLoading ? 'hidden' : 'flex'} gap-2 flex-wrap animate-fade`}>
        {photos.map((photo, pIdx) => (
          <div
            key={pIdx}
            onClick={() => onZoom?.(photo)}
            className={`relative rounded-lg bg-slate-100 border border-slate-200 overflow-hidden ${
              onZoom ? 'cursor-zoom-in hover:scale-105 transition-all' : ''
            }`}
          >
            <img
              src={photo}
              alt="Preuve"
              className="w-12 h-12 object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
              onLoad={() => setLoadedCount((prev) => prev + 1)}
              onError={() => setLoadedCount((prev) => prev + 1)}
            />
          </div>
        ))}
      </div>
    </>
  );
};

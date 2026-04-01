'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Download, Mic, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { SafeImage } from '@/components/custom/SafeImage';
import { cn } from '@/lib/utils';
import type { MediaData } from './chat-message-types';

interface MediaRendererProps {
  media: MediaData | undefined;
}

export const MediaRenderer: React.FC<MediaRendererProps> = React.memo(({ media }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleCloseLightbox = useCallback(
    (open: boolean) => {
      if (!open) resetView();
      setLightboxOpen(open);
    },
    [resetView],
  );

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.5, 5)), []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(z - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (zoom > 1) {
      resetView();
    } else {
      setZoom(2);
    }
  }, [zoom, resetView]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      isDraggingRef.current = true;
      dragStartRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
      e.preventDefault();
    },
    [zoom, pan],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.mx;
    const dy = e.clientY - dragStartRef.current.my;
    setPan({ x: dragStartRef.current.px + dx, y: dragStartRef.current.py + dy });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
  }, []);

  const handleDownload = useCallback(async () => {
    if (!media) return;
    try {
      const response = await fetch(media.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const ext = (blob.type || media.mimeType).split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      a.download = `imagen_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(media.url, '_blank');
    }
  }, [media]);

  useEffect(() => {
    const el = imageContainerRef.current;
    if (!el || !lightboxOpen) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => {
        const next = e.deltaY < 0 ? Math.min(z + 0.25, 5) : Math.max(z - 0.25, 1);
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [lightboxOpen]);

  if (!media) return null;

  const { type, url, mimeType, caption } = media;
  const baseStyle = 'my-1 rounded-md overflow-hidden border dark:border-gray-600';
  const audioDocStyle = 'w-full max-w-[350px]';

  return (
    <div
      className={cn(
        baseStyle,
        'max-w-full',
        type === 'audio' || type === 'document' ? audioDocStyle : 'md:max-w-[300px]',
      )}
    >
      {type === 'image' && (
        <>
          <SafeImage
            src={url}
            alt={caption || 'Imagen'}
            className="w-full h-auto object-cover max-h-[300px] cursor-zoom-in"
            onClick={() => setLightboxOpen(true)}
            loading="lazy"
            decoding="async"
          />
          <Dialog open={lightboxOpen} onOpenChange={handleCloseLightbox}>
            <DialogContent className="max-w-[95vw] sm:max-w-[85vw] max-h-[95vh] p-0 border-none bg-black/95 flex flex-col overflow-hidden">
              <DialogTitle className="sr-only">{caption || 'Previsualización de imagen'}</DialogTitle>
              <div
                ref={imageContainerRef}
                className={cn(
                  'flex-1 flex items-center justify-center overflow-hidden min-h-[50vh] select-none p-4',
                  zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
                )}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
              >
                <SafeImage
                  src={url}
                  alt={caption || 'Imagen'}
                  className="max-w-full max-h-[75vh] object-contain rounded pointer-events-none"
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                    transition: zoom > 1 ? 'none' : 'transform 0.15s ease',
                  }}
                  draggable={false}
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-black/80 border-t border-white/10 shrink-0">
                {caption && (
                  <span className="text-white/60 text-xs truncate max-w-[180px]">{caption}</span>
                )}
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                    aria-label="Reducir zoom"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-white/70 text-xs w-12 text-center tabular-nums">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={handleZoomIn}
                    disabled={zoom >= 5}
                    aria-label="Aumentar zoom"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-5 bg-white/20 mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={resetView}
                    disabled={zoom === 1}
                    aria-label="Restablecer vista"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                    onClick={handleDownload}
                    aria-label="Descargar imagen"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {type === 'video' && (
        <video
          src={url}
          controls
          className="w-full h-auto max-h-[300px] bg-black"
          poster={caption}
          preload="metadata"
        />
      )}

      {type === 'audio' && (
        <div className="p-2 bg-white dark:bg-gray-700 flex items-center border-t dark:border-gray-600">
          <Mic className="w-5 h-5 text-gray-500 dark:text-gray-300 mr-2 flex-shrink-0" />
          <audio src={url} controls className="flex-1 h-8" preload="metadata" />
        </div>
      )}

      {type === 'document' && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-blue-500 text-white flex items-center justify-between hover:bg-blue-600 transition"
          aria-label="Abrir documento"
        >
          <span className="truncate">{caption || mimeType}</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      )}
    </div>
  );
});

MediaRenderer.displayName = 'MediaRenderer';

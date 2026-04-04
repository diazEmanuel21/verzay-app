'use client';

import React, { useCallback } from 'react';
import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { MediaData } from '../chat-message-types';
import { getViewer } from './viewer-registry';

interface MediaViewerProps {
  media: MediaData;
  open: boolean;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  image: 'Imagen',
  video: 'Video',
  audio: 'Audio',
  document: 'Documento',
};

export const MediaViewer: React.FC<MediaViewerProps> = ({ media, open, onClose }) => {
  const { type, url, mimeType, caption } = media;
  const ViewerComponent = getViewer(type);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const ext = (blob.type || mimeType).split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
      a.download = `${type}_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  }, [url, mimeType, type]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[90vw] w-full max-h-[95vh] p-0 border-none bg-black/95 flex flex-col overflow-hidden"
      >
        <DialogTitle className="sr-only">
          {caption || TYPE_LABELS[type] || 'Visor multimedia'}
        </DialogTitle>

        {/* Top bar — pr-10 leaves room for the auto-injected DialogClose X button */}
        <div className="flex items-center gap-3 pl-4 pr-12 py-2.5 bg-black/80 border-b border-white/10 shrink-0">
          {caption ? (
            <span className="text-white/70 text-sm truncate">{caption}</span>
          ) : (
            <span className="text-white/30 text-xs uppercase tracking-widest">
              {TYPE_LABELS[type] ?? type}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 ml-auto shrink-0"
            onClick={handleDownload}
            aria-label="Descargar archivo"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Content — each viewer fills this area and manages its own internal layout */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ViewerComponent url={url} mimeType={mimeType} caption={caption} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

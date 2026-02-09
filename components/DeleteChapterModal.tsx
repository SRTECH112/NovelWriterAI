'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteChapterModalProps {
  chapterNumber: number;
  chapterTitle: string;
  pageCount: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteChapterModal({
  chapterNumber,
  chapterTitle,
  pageCount,
  onConfirm,
  onCancel,
}: DeleteChapterModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error deleting chapter:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Delete Chapter {chapterNumber}?</h2>
            <p className="text-sm text-muted-foreground mb-2">
              "{chapterTitle}"
            </p>
          </div>
        </div>

        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-sm mb-2">
            This will permanently remove:
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• <strong>{pageCount} page{pageCount !== 1 ? 's' : ''}</strong> in this chapter</li>
            <li>• Chapter outline and metadata</li>
            <li>• All generated content</li>
          </ul>
          <p className="text-sm mt-3 font-semibold text-destructive">
            ⚠️ This action cannot be undone.
          </p>
        </div>

        <div className="bg-muted/50 border rounded-lg p-3 mb-6">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Remaining chapters will be automatically re-numbered. 
            AI memory will be updated to exclude deleted content.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Chapter'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

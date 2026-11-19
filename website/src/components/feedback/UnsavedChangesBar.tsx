import { AnimatePresence, m } from '@/lib/panel-motion';
import { Check, RefreshCw } from '@/components/icons';
import { createPortal } from 'preact/compat';

interface UnsavedChangesBarProps {
  show: boolean;
  isSaving?: boolean;
  saveSuccess?: boolean;
  message?: string;
  onReset: () => void;
  onSave: () => void;
}

export function UnsavedChangesBar({
  show,
  isSaving = false,
  saveSuccess = false,
  message = 'Careful, you have unsaved changes!',
  onReset,
  onSave,
}: UnsavedChangesBarProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[990] w-[min(calc(100vw-2rem),36rem)] rounded-xl bg-[var(--admin-elevated)]/95 text-[var(--admin-fg)] pl-4 pr-1 py-1 backdrop-blur-xl flex items-center justify-between gap-3 shadow-2xl"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-semibold truncate text-[var(--admin-fg)] tracking-tight">
              {message}
            </span>
          </div>

          <div className="inline-flex items-center p-1 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-md text-[#ff453a] hover:underline decoration-red-500 underline-offset-4 transition-colors cursor-pointer disabled:opacity-50"
            >
              Reset
            </button>

            <m.button
              type="button"
              disabled={isSaving}
              onClick={onSave}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold rounded-md bg-[#1a642c] text-white hover:bg-[#1e7e34] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
              ) : saveSuccess ? (
                <Check className="h-4 w-4 text-white" />
              ) : null}
              <span>{saveSuccess ? 'Saved!' : 'Save Changes'}</span>
            </m.button>
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
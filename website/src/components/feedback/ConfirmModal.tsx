import { AnimatePresence, m } from '@/lib/panel-motion';
import { Loader2 } from '@/components/icons';
import { createPortal } from 'preact/compat';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          <m.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 w-full max-w-sm rounded-2xl bg-[var(--admin-card)] text-[var(--admin-fg)] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start gap-4">

              <div className="space-y-1.5 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-[var(--admin-fg)] tracking-tight">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--admin-muted)] leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--admin-elevated)] text-[var(--admin-fg)] hover:opacity-80 transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${isDanger
                  ? 'bg-[#ff453a] text-white hover:bg-[#e03b32]'
                  : 'bg-amber-500 text-black hover:bg-amber-400'
                  } disabled:opacity-50`}
              >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{confirmText}</span>
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  titleAr,
  titleFr,
  wide = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  titleAr: string;
  titleFr: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content
          className={wide ? "modal modal-wide" : "modal"}
          dir="rtl"
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement | null;
            if (
              target?.closest("[data-radix-select-content]") ||
              target?.closest("[data-radix-popper-content-wrapper]")
            ) {
              event.preventDefault();
            }
          }}
        >
          <header className="modal-head">
            <div>
              <Dialog.Title className="modal-title" lang="ar">
                {titleAr}
              </Dialog.Title>
              <Dialog.Description className="modal-fr" lang="fr">
                {titleFr}
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-btn" aria-label="إغلاق · Fermer">
              <X size={18} />
            </Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

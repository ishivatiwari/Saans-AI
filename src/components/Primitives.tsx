import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
export function Skyline() {
  return (
    <svg
      className="skyline"
      viewBox="0 0 630 230"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="440" cy="78" r="50" fill="#efebca" />
      <path d="M0 177c110-48 180-48 300-8s220-37 330-17v78H0Z" fill="#dce6d9" />
      <g fill="#c6d6c6">
        <path d="M27 104h40v112H27zM75 145h32v71H75zM122 87h52v129h-52zM185 123h31v93h-31zM236 65h54v151h-54zM306 102h40v114h-40zM373 134h31v82h-31zM419 92h42v124h-42zM476 131h48v85h-48zM544 77h46v139h-46z" />
      </g>
      <g stroke="#edf3e9" strokeWidth="3">
        <path d="M136 103v90m22-90v90m91-108v110m27-110v110M433 109v84m16-84v84M558 94v105m17-105v105" />
      </g>
      <path
        d="M301 217v-63h29v-21h24v-17h18v17h24v21h29v63m-108 0v-49h18v49m51 0v-49h18v49"
        fill="#9eb7a2"
      />
      <path d="M348 117V99m-8 19h33" stroke="#9eb7a2" strokeWidth="3" />
      <path d="M0 215h630" stroke="#799c82" strokeWidth="2" />
      <g fill="#7e9e80">
        <ellipse cx="52" cy="185" rx="19" ry="25" />
        <ellipse cx="211" cy="188" rx="16" ry="23" />
        <ellipse cx="493" cy="180" rx="22" ry="30" />
        <ellipse cx="607" cy="185" rx="21" ry="29" />
      </g>
      <g stroke="#668d71" strokeWidth="3">
        <path d="M52 185v32m159-27v27m282-37v37m114-32v32" />
      </g>
      <path
        d="m90 54 10-4 10 4m16 12 7-4 7 4m237-20 9-4 9 4"
        stroke="#9aac99"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      className="modal"
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

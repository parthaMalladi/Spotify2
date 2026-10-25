import { useEffect } from "react";
import { createPortal } from "react-dom";

// Phones: a menu that slides up from the bottom, standing in for right-click menus and per-row buttons.
// `children` are ordinary buttons (and the "Add to playlist…" dropdown). Tapping any button inside closes
// the sheet, and so does picking from a dropdown; tapping outside or Cancel closes it without doing anything.
export default function ActionSheet({ header, onClose, children }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleClick(event) {
    event.stopPropagation(); // don't reach the backdrop
    if (event.target.closest("button")) onClose();
  }

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="action-sheet" role="menu" onClick={handleClick} onChange={onClose}>
        {header && <div className="action-sheet-header">{header}</div>}
        <div className="action-sheet-items">{children}</div>
        <button className="action-sheet-cancel">Cancel</button>
      </div>
    </div>,
    document.body,
  );
}

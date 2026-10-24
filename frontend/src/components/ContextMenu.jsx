import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH = 220;
const ITEM_HEIGHT = 38; // rough height of one item, to keep the menu on screen

// A small right-click menu at (x, y). Closes on any click outside, Escape, scrolling or resizing.
// items: [{ label, onClick, disabled }]
// Rendered straight into <body> (a portal) so it always sits above the rest of the page. Inside the sticky
// sidebar its z-index would only apply within the sidebar, and the song table's play buttons covered it.
export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!ref.current?.contains(event.target)) onClose();
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  // Keep the menu inside the window when opened near the right or bottom edge.
  const left = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const top = Math.min(y, window.innerHeight - items.length * ITEM_HEIGHT - 16);

  return createPortal(
    <div ref={ref} className="context-menu" style={{ left, top, width: MENU_WIDTH }} role="menu">
      {items.map((item) => (
        <button
          key={item.label}
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            onClose();
            item.onClick();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}

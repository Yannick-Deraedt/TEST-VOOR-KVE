import React from "react";
import ReactDOM from "react-dom";

type Props = {
  onClick: () => void | Promise<void>;
  success: boolean;
};

const base: React.CSSProperties = {
  position: "fixed",
  right: 20,
  bottom: 20,
  width: 64,
  height: 64,
  borderRadius: 9999,
  background: "rgba(240,245,255,0.75)",
  boxShadow: "0 8px 32px rgba(80,140,255,0.18)",
  border: "1.5px solid rgba(255,255,255,0.35)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 99999,
  cursor: "pointer",
  transition: "transform 0.12s ease, box-shadow 0.2s ease, background 0.2s ease",
};

const FloatingCopyButton: React.FC<Props> = ({ onClick, success }) => {
  return ReactDOM.createPortal(
    <button
      onClick={onClick}
      title="Kopieer e-mail"
      aria-label="Kopieer e-mail"
      style={{
        ...base,
        transform: success ? "scale(1.05)" : "scale(1)",
        background: success ? "rgba(180,235,200,0.85)" : base.background,
        boxShadow: success
          ? "0 10px 40px rgba(80,200,140,0.28), 0 0 0 3px rgba(120,200,160,0.18)"
          : base.boxShadow,
        border: success ? "2px solid rgba(60,170,120,0.8)" : base.border,
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1 }}>📋</span>
      {success && (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            width: 24,
            height: 24,
            borderRadius: 999,
            background: "#21b66f",
            color: "white",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
          aria-hidden
        >
          ✓
        </span>
      )}
    </button>,
    document.body
  );
};

export default FloatingCopyButton;

import { memo } from "react";

interface MascotProps {
  mood?: "ready" | "thinking" | "happy" | "proud";
  compact?: boolean;
}

function MascotComponent({ mood = "ready", compact = false }: MascotProps) {
  return (
    <div
      aria-hidden="true"
      className={`mascot mascot--${mood}${compact ? " mascot--compact" : ""}`}
    >
      <div className="mascot__shadow" />
      <div className="mascot__ear mascot__ear--left" />
      <div className="mascot__ear mascot__ear--right" />
      <div className="mascot__body">
        <div className="mascot__shine" />
        <div className="mascot__eye mascot__eye--left"><span /></div>
        <div className="mascot__eye mascot__eye--right"><span /></div>
        <div className="mascot__cheek mascot__cheek--left" />
        <div className="mascot__cheek mascot__cheek--right" />
        <div className="mascot__mouth" />
      </div>
    </div>
  );
}

export const Mascot = memo(MascotComponent);

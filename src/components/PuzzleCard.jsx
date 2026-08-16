import React, { useRef, useState, useEffect, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Marco de card con forma de pieza de puzle simplificada:
 * esquinas rectas, saliente arriba e izquierda, muesca (hoyo) abajo y derecha.
 * El radio es fijo en px para no invadir el contenido ni desbordar.
 *
 * Personalidad:
 *  - accent (hex): tiñe el trazo del área (enlace de encaje).
 *  - status: "idea" discreta · "buscando/activandose" trazo de área ·
 *    "funcionando" relleno suave + brillo · "necesita_piezas" trazo discontinuo.
 */
const R = 14;

export default function PuzzleCard({ children, className, active = false, hover = true, accent, status }) {
  const ref = useRef(null);
  const [{ w, h }, setSize] = useState({ w: 0, h: 0 });
  const clipId = "pc-clip-" + useId().replace(/:/g, "");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w: W, h: H } = { w, h };
  const d =
    W > 0 && H > 0
      ? `M0 0 L${W / 2 - R} 0 A${R} ${R} 0 0 0 ${W / 2 + R} 0 L${W} 0 L${W} ${H / 2 - R} A${R} ${R} 0 0 1 ${W} ${H / 2 + R} L${W} ${H} L${W / 2 + R} ${H} A${R} ${R} 0 0 1 ${W / 2 - R} ${H} L0 ${H} L0 ${H / 2 + R} A${R} ${R} 0 0 0 0 ${H / 2 - R} Z`
      : "";

  // trazo: siempre con el color del área, grosor y opacidad uniformes
  const strokeProps = {};
  let strokeClass = "";
  if (accent) {
    strokeProps.stroke = accent;
    strokeProps.strokeOpacity = 1;
  } else {
    strokeClass = "stroke-accent group-hover:stroke-accent";
  }

  // relleno: siempre blanco
  const fillProps = {};
  const fillClass = "fill-card";
  const svgStyle = { overflow: "visible" };

  // sombra / brillo
  let svgClass = "absolute inset-0 w-full h-full transition-[filter] duration-300";
  svgClass += hover
    ? " group-hover:[filter:drop-shadow(0_10px_18px_rgba(20,14,12,0.05))]"
    : "";

  return (
    <div ref={ref} className={cn("group relative h-full", className)}>
      <svg className={svgClass} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={svgStyle}>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={d} />
          </clipPath>
        </defs>
        {d && (
          <path
            d={d}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            className={cn("transition-colors duration-300", strokeClass, fillClass)}
            {...strokeProps}
            {...fillProps}
          />
        )}
      </svg>
      <div className="relative z-10 h-full" style={{ clipPath: `url(#${clipId})` }}>{children}</div>
    </div>
  );
}
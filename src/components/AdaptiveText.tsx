import { useEffect, useRef, useState } from "react";
import type { WordBox } from "@/lib/gaze/tracker";
import { cn } from "@/utils/cn";

interface AdaptiveTextProps {
  body: string;
  // current gaze point in normalized 0..1 coords
  gazeX: number | null;
  gazeY: number | null;
  adaptationLevel: number; // 0..4
  // out: word boxes for tracker to use
  onWordBoxes?: (boxes: WordBox[]) => void;
  // highlight word-by-word mode (level >= 4)
  highlightWordByWord?: boolean;
  struggledWords?: Record<string, number>;
}

/**
 * Renders a paragraph as clickable word spans, measures their bounding boxes
 * in normalized coordinates, applies the adaptive UI styling based on level,
 * and highlights the word currently under the gaze point (plus recently
 * struggled words) without interrupting reading flow.
 */
export function AdaptiveText({
  body,
  gazeX,
  gazeY,
  adaptationLevel,
  onWordBoxes,
  highlightWordByWord = true,
  struggledWords = {},
}: AdaptiveTextProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wordRefs = useRef<HTMLSpanElement[]>([]);
  const [currentWord, setCurrentWord] = useState<number | null>(null);

  // Split on whitespace but keep Devanagari/Tamil punctuation attached.
  const words = body.trim().split(/\s+/).filter(Boolean);

  // Remeasure on resize / adaptation changes
  useEffect(() => {
    function measure() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const boxes: WordBox[] = wordRefs.current.map((w, i) => {
        const r = w.getBoundingClientRect();
        const left = (r.left - rect.left) / rect.width;
        const right = (r.right - rect.left) / rect.width;
        const top = (r.top - rect.top) / rect.height;
        const bottom = (r.bottom - rect.top) / rect.height;
        return {
          index: i,
          word: words[i],
          left,
          right,
          top,
          bottom,
          centerX: (left + right) / 2,
          centerY: (top + bottom) / 2,
        };
      });
      onWordBoxes?.(boxes);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [body, adaptationLevel, onWordBoxes, words.join(" ")]);

  // Hit-test current gaze point to find word under gaze
  useEffect(() => {
    if (gazeX == null || gazeY == null) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = gazeX;
    const ny = gazeY;
    let best: { idx: number; dist: number } | null = null;
    wordRefs.current.forEach((w, i) => {
      if (!w) return;
      const r = w.getBoundingClientRect();
      const lx = (r.left - rect.left) / rect.width;
      const rx = (r.right - rect.left) / rect.width;
      const ty = (r.top - rect.top) / rect.height;
      const by = (r.bottom - rect.top) / rect.height;
      const cx = (lx + rx) / 2;
      const cy = (ty + by) / 2;
      const insideX = nx >= lx - 0.01 && nx <= rx + 0.01;
      const insideY = ny >= ty - 0.01 && ny <= by + 0.01;
      if (insideX && insideY) {
        if (best === null || 0 < best.dist) best = { idx: i, dist: 0 };
      } else {
        const dx = nx - cx;
        const dy = ny - cy;
        const halfW = (rx - lx) / 2 + 0.02;
        const halfH = (by - ty) / 2 + 0.02;
        const d = Math.sqrt((dx / halfW) ** 2 + (dy / halfH) ** 2);
        if (d < 0.6 && (best === null || d < best.dist)) best = { idx: i, dist: d };
      }
    });
    setCurrentWord((best as unknown as { idx: number } | null)?.idx ?? null);
  }, [gazeX, gazeY]);

  const adaptClass =
    adaptationLevel >= 4
      ? "adapt-level-4"
      : adaptationLevel === 3
      ? "adapt-level-3"
      : adaptationLevel === 2
      ? "adapt-level-2"
      : adaptationLevel === 1
      ? "adapt-level-1"
      : "";

  const useOpendyslexicOnly = adaptationLevel >= 1;

  return (
    <div
      ref={containerRef}
      className={cn(
        "warm-tint relative px-6 py-8 sm:px-10 sm:py-10 rounded-3xl",
        "bg-white/90 shadow-lg ring-1 ring-amber-100",
        "text-[1.35rem] sm:text-[1.6rem] leading-relaxed text-slate-800",
        useOpendyslexicOnly && "font-opendyslexic",
        adaptClass,
        adaptationLevel >= 2 && "tint-2",
        adaptationLevel >= 3 && "tint-3",
        adaptationLevel >= 4 && "tint-4"
      )}
      style={{ minHeight: "60vh" }}
    >
      {words.map((w, i) => {
        const isCurrent = highlightWordByWord && currentWord === i;
        const isStruggled = struggledWords[w] && struggledWords[w] >= 1;
        return (
          <span
            key={i}
            ref={(el) => {
              if (el) wordRefs.current[i] = el;
            }}
            className={cn(
              "reading-word",
              isCurrent && "is-current",
              isStruggled && !isCurrent && "is-struggled",
              currentWord != null && i < currentWord && "visited"
            )}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

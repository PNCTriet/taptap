"use client";

import React, { useMemo } from "react";
import { Download } from "lucide-react";

interface QrCodeSvgProps {
  value: string;
  label: string;
  code: string;
  size?: number;
}

/**
 * Generates a deterministic 21x21 QR-style visual matrix with standard finder patterns
 * from the input URL string, suitable for station QR plaque previews and SVG export.
 */
function buildDeterministicMatrix(input: string): boolean[][] {
  const gridSize = 21;
  const matrix: boolean[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => false)
  );

  const drawFinder = (rowOffset: number, colOffset: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const row = matrix[rowOffset + r];
        if (row) {
          row[colOffset + c] = isBorder || isInner;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    const row6 = matrix[6];
    const rowI = matrix[i];
    if (row6) row6[i] = i % 2 === 0;
    if (rowI) rowI[6] = i % 2 === 0;
  }

  // Deterministic hash fill for remaining modules
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (inTopLeft || inTopRight || inBottomLeft || isTiming) continue;

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      const row = matrix[r];
      if (row) {
        row[c] = (Math.abs(hash) + r + c) % 3 !== 0;
      }
    }
  }

  return matrix;
}

export function QrCodeSvg({ value, label, code, size = 140 }: QrCodeSvgProps) {
  const matrix = useMemo(() => buildDeterministicMatrix(value), [value]);
  const gridSize = 21;
  const quietZone = 2;
  const totalModules = gridSize + quietZone * 2;

  const handleDownloadSvg = () => {
    const rects: string[] = [];
    matrix.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell) {
          rects.push(
            `<rect x="${cIdx + quietZone}" y="${rIdx + quietZone}" width="1" height="1" rx="0.18" fill="#176B61" />`
          );
        }
      });
    });

    const svgMarkup = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${
      totalModules + 4
    }" width="500" height="580">
  <rect width="100%" height="100%" rx="2" fill="#FFF8EB" />
  ${rects.join("\n  ")}
  <text x="${totalModules / 2}" y="${
      totalModules + 2.2
    }" font-family="monospace" font-size="1.2" font-weight="bold" fill="#272E2B" text-anchor="middle">${code}</text>
</svg>`;

    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taptap-station-${code}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-2xl border border-[#E6DECB] bg-[#FFF8EB] p-3">
      <svg
        viewBox={`0 0 ${totalModules} ${totalModules}`}
        width={size}
        height={size}
        role="img"
        aria-label={`QR Code for ${label} (${value})`}
        className="rounded-xl bg-white p-1.5 border border-[#E6DECB]"
      >
        <rect width="100%" height="100%" fill="#FFFFFF" />
        {matrix.map((row, rIdx) =>
          row.map((cell, cIdx) =>
            cell ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx + quietZone}
                y={rIdx + quietZone}
                width={1}
                height={1}
                rx={0.18}
                fill="#176B61"
              />
            ) : null
          )
        )}
      </svg>

      <div className="text-center">
        <p className="font-mono text-[11px] font-bold text-[#272E2B]">{code}</p>
        <button
          type="button"
          onClick={handleDownloadSvg}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-3 py-1 text-[11px] font-bold transition-colors"
        >
          <Download className="h-3 w-3" />
          Download SVG
        </button>
      </div>
    </div>
  );
}

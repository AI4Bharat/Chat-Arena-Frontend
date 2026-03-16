// Bounding box utilities for the OCR arena canvas editor
// All boxes are [x1, y1, x2, y2] in image-natural pixel coordinates.

/** Convert [x1,y1,x2,y2] to { x, y, w, h } for canvas rendering */
export function boxToRect([x1, y1, x2, y2]) {
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Normalise a box so that x1<=x2, y1<=y2 */
export function normaliseBox([x1, y1, x2, y2]) {
  return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
}

/** Clamp box coordinates to image boundaries */
export function clampBox([x1, y1, x2, y2], imgW, imgH) {
  return [
    Math.max(0, Math.min(imgW, x1)),
    Math.max(0, Math.min(imgH, y1)),
    Math.max(0, Math.min(imgW, x2)),
    Math.max(0, Math.min(imgH, y2)),
  ];
}

/** Returns true if a point {x,y} is inside a box */
export function pointInBox(point, [x1, y1, x2, y2]) {
  return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2;
}

/** Sort annotations by reading order (top-to-bottom, left-to-right) */
export function sortAnnotationsByPosition(annotations) {
  return [...annotations].sort((a, b) => {
    const dy = a.box[1] - b.box[1];
    return Math.abs(dy) < 10 ? a.box[0] - b.box[0] : dy;
  });
}

// ─── Resize Handles ──────────────────────────────────────────────────────────
// 8 handles at corners + midpoints, labeled by position

export const HANDLE_IDS = ['TL', 'TC', 'TR', 'ML', 'MR', 'BL', 'BC', 'BR'];

export function getHandlePositions([x1, y1, x2, y2]) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return {
    TL: { x: x1, y: y1 },
    TC: { x: mx, y: y1 },
    TR: { x: x2, y: y1 },
    ML: { x: x1, y: my },
    MR: { x: x2, y: my },
    BL: { x: x1, y: y2 },
    BC: { x: mx, y: y2 },
    BR: { x: x2, y: y2 },
  };
}

/** Returns which handle (if any) a point is near (within hitRadius px) */
export function getHandleAtPoint(box, point, hitRadius = 7) {
  const handles = getHandlePositions(box);
  for (const id of HANDLE_IDS) {
    const h = handles[id];
    if (Math.abs(h.x - point.x) <= hitRadius && Math.abs(h.y - point.y) <= hitRadius) {
      return id;
    }
  }
  return null;
}

/** Apply a resize drag given which handle is active and the new cursor position.
 *  Returns the updated box [x1,y1,x2,y2]. */
export function applyResize(originalBox, handle, delta) {
  let [x1, y1, x2, y2] = originalBox;
  const { dx, dy } = delta;
  switch (handle) {
    case 'TL': x1 += dx; y1 += dy; break;
    case 'TC':            y1 += dy; break;
    case 'TR': x2 += dx; y1 += dy; break;
    case 'ML': x1 += dx;            break;
    case 'MR': x2 += dx;            break;
    case 'BL': x1 += dx; y2 += dy; break;
    case 'BC':            y2 += dy; break;
    case 'BR': x2 += dx; y2 += dy; break;
    default: break;
  }
  return normaliseBox([x1, y1, x2, y2]);
}

/** Apply a move drag.  Returns updated box [x1,y1,x2,y2]. */
export function applyMove([x1, y1, x2, y2], delta) {
  return [x1 + delta.dx, y1 + delta.dy, x2 + delta.dx, y2 + delta.dy];
}

/** CSS cursor names for each resize handle direction */
export const HANDLE_CURSORS = {
  TL: 'nw-resize', TC: 'n-resize', TR: 'ne-resize',
  ML: 'w-resize',                  MR: 'e-resize',
  BL: 'sw-resize', BC: 's-resize', BR: 'se-resize',
};

/**
 * Convert a mouse event to image-natural coordinates, accounting for CSS zoom.
 * zoomLevel is the CSS transform scale factor applied to the canvas container.
 */
export function toNaturalCoords(e, canvasRef, zoomLevel) {
  const rect = canvasRef.current.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / zoomLevel,
    y: (e.clientY - rect.top) / zoomLevel,
  };
}

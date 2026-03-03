import { test, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Drawing overlay injection helper
// ---------------------------------------------------------------------------

async function injectDrawingOverlay(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolveDone) => {
      const dpr = window.devicePixelRatio || 1;

      // ── State ──────────────────────────────────────────────────────────
      type StrokeEntry =
        | { tool: 'pen' | 'eraser'; color: string; width: number; points: { x: number; y: number }[] }
        | { tool: 'arrow'; color: string; width: number; from: { x: number; y: number }; to: { x: number; y: number } }
        | { tool: 'text'; color: string; size: number; x: number; y: number; value: string };

      type ToolType = 'pen' | 'arrow' | 'text' | 'eraser' | 'sticky';
      let currentTool: ToolType = 'pen';
      let currentColor = '#ef4444';
      let currentStickyColor = '#fef08a';
      let currentWidth = 3;
      let drawMode = true;
      let isDrawing = false;
      let currentPoints: { x: number; y: number }[] = [];
      let arrowStart: { x: number; y: number } | null = null;
      const strokes: StrokeEntry[] = [];
      const stickyNotes: HTMLDivElement[] = [];

      // ── Canvas ─────────────────────────────────────────────────────────
      const canvas = document.createElement('canvas');
      canvas.id = 'pw-draw-canvas';
      Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: innerWidth + 'px',
        height: innerHeight + 'px',
        zIndex: '99998',
        pointerEvents: 'all',
        cursor: 'crosshair',
      });
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);

      // ── Mode border ────────────────────────────────────────────────────
      const border = document.createElement('div');
      border.id = 'pw-draw-mode-border';
      Object.assign(border.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '99997',
        pointerEvents: 'none',
        boxSizing: 'border-box',
        border: '3px solid #ef4444',
        transition: 'border-color 0.2s',
      });
      document.body.appendChild(border);

      // ── Toolbar ────────────────────────────────────────────────────────
      const toolbar = document.createElement('div');
      toolbar.id = 'pw-draw-toolbar';
      Object.assign(toolbar.style, {
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '99999',
        background: '#1e1e2e',
        borderRadius: '8px',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '13px',
        color: '#cdd6f4',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        pointerEvents: 'auto',
        userSelect: 'none',
      });
      document.body.appendChild(toolbar);

      // Helper: create a toolbar button
      function makeBtn(label: string, onClick: () => void, extraStyle: Partial<CSSStyleDeclaration> = {}): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = label;
        Object.assign(btn.style, {
          background: '#313244',
          color: '#cdd6f4',
          border: '1px solid #45475a',
          borderRadius: '4px',
          padding: '4px 10px',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          lineHeight: '1.4',
          ...extraStyle,
        });
        btn.addEventListener('click', onClick);
        return btn;
      }

      // Helper: separator
      function sep(): HTMLSpanElement {
        const s = document.createElement('span');
        Object.assign(s.style, {
          width: '1px',
          height: '20px',
          background: '#45475a',
          margin: '0 4px',
          flexShrink: '0',
        });
        return s;
      }

      // --- Mode toggle ---
      const modeBtn = makeBtn('Draw', () => toggleMode());
      toolbar.appendChild(modeBtn);
      toolbar.appendChild(sep());

      // --- Tool buttons ---
      const toolButtons: Record<string, HTMLButtonElement> = {};
      const tools: { label: string; tool: ToolType }[] = [
        { label: 'Pen', tool: 'pen' },
        { label: 'Arrow', tool: 'arrow' },
        { label: 'Text', tool: 'text' },
        { label: 'Sticky', tool: 'sticky' },
        { label: 'Eraser', tool: 'eraser' },
      ];
      for (const t of tools) {
        const btn = makeBtn(t.label, () => selectTool(t.tool));
        toolButtons[t.tool] = btn;
        toolbar.appendChild(btn);
      }
      toolbar.appendChild(sep());

      // --- Color palette container (swaps between draw and sticky palettes) ---
      const colorContainer = document.createElement('div');
      Object.assign(colorContainer.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      });
      toolbar.appendChild(colorContainer);

      const drawColors = [
        { c: '#ef4444', emoji: '\u{1F534}' },
        { c: '#3b82f6', emoji: '\u{1F535}' },
        { c: '#22c55e', emoji: '\u{1F7E2}' },
        { c: '#1e1e2e', emoji: '\u26AB' },
      ];
      const stickyColors = [
        { c: '#fef08a', label: '\u{1F7E1}' },
        { c: '#fed7aa', label: '\u{1F7E0}' },
        { c: '#bbf7d0', label: '\u{1F7E2}' },
        { c: '#bfdbfe', label: '\u{1F535}' },
        { c: '#e9d5ff', label: '\u{1F7E3}' },
      ];

      let drawColorButtons: HTMLButtonElement[] = [];
      let stickyColorButtons: HTMLButtonElement[] = [];

      function buildColorPalette() {
        colorContainer.innerHTML = '';
        drawColorButtons = [];
        stickyColorButtons = [];

        if (currentTool === 'sticky') {
          for (const { c, label } of stickyColors) {
            const btn = makeBtn(label, () => {
              currentStickyColor = c;
              updateColorHighlights();
            }, { fontSize: '14px', padding: '2px 6px' });
            stickyColorButtons.push(btn);
            colorContainer.appendChild(btn);
          }
        } else {
          for (const { c, emoji } of drawColors) {
            const btn = makeBtn(emoji, () => selectColor(c), { fontSize: '14px', padding: '2px 6px' });
            drawColorButtons.push(btn);
            colorContainer.appendChild(btn);
          }
        }
        updateColorHighlights();
      }

      function updateColorHighlights() {
        if (currentTool === 'sticky') {
          stickyColorButtons.forEach((btn, i) => {
            btn.style.outline = stickyColors[i].c === currentStickyColor ? '2px solid #cdd6f4' : 'none';
            btn.style.outlineOffset = '1px';
          });
        } else {
          drawColorButtons.forEach((btn, i) => {
            btn.style.outline = drawColors[i].c === currentColor ? '2px solid #cdd6f4' : 'none';
            btn.style.outlineOffset = '1px';
          });
        }
      }

      toolbar.appendChild(sep());

      // --- Width buttons ---
      const widths = [
        { label: 'S', w: 2 },
        { label: 'M', w: 4 },
        { label: 'L', w: 8 },
      ];
      const widthButtons: HTMLButtonElement[] = [];
      for (const { label, w } of widths) {
        const btn = makeBtn(label, () => selectWidth(w));
        widthButtons.push(btn);
        toolbar.appendChild(btn);
      }
      toolbar.appendChild(sep());

      // --- Undo / Clear ---
      toolbar.appendChild(makeBtn('Undo', undo));
      toolbar.appendChild(makeBtn('Clear', clearAll));
      toolbar.appendChild(sep());

      // --- Done ---
      toolbar.appendChild(makeBtn('Done', finish, {
        background: '#a6e3a1',
        color: '#1e1e2e',
        fontWeight: '600',
      }));

      // ── UI update helpers ──────────────────────────────────────────────
      function updateToolButtons() {
        for (const [key, btn] of Object.entries(toolButtons)) {
          btn.style.background = key === currentTool ? '#585b70' : '#313244';
          btn.style.fontWeight = key === currentTool ? '700' : '400';
        }
      }

      function updateColorButtons() {
        updateColorHighlights();
      }

      function updateWidthButtons() {
        widthButtons.forEach((btn, i) => {
          btn.style.background = widths[i].w === currentWidth ? '#585b70' : '#313244';
          btn.style.fontWeight = widths[i].w === currentWidth ? '700' : '400';
        });
      }

      function updateModeUI() {
        modeBtn.textContent = drawMode ? 'Draw' : 'Interact';
        modeBtn.style.background = drawMode ? '#f38ba8' : '#a6e3a1';
        modeBtn.style.color = '#1e1e2e';
        canvas.style.pointerEvents = drawMode ? 'all' : 'none';
        canvas.style.cursor = drawMode ? 'crosshair' : 'default';
        border.style.borderColor = drawMode ? '#ef4444' : 'transparent';
      }

      // ── Actions ────────────────────────────────────────────────────────
      function selectTool(tool: ToolType) {
        const wasStickyBefore = currentTool === 'sticky';
        currentTool = tool;
        canvas.style.cursor = (tool === 'text' || tool === 'sticky') ? 'cell' : 'crosshair';
        updateToolButtons();
        // Rebuild color palette when switching to/from sticky
        if ((tool === 'sticky') !== wasStickyBefore) {
          buildColorPalette();
        }
      }

      function selectColor(c: string) {
        currentColor = c;
        updateColorButtons();
      }

      function selectWidth(w: number) {
        currentWidth = w;
        updateWidthButtons();
      }

      function toggleMode() {
        drawMode = !drawMode;
        updateModeUI();
      }

      function undo() {
        if (strokes.length === 0) return;
        strokes.pop();
        redrawAll();
      }

      function clearAll() {
        strokes.length = 0;
        redrawAll();
      }

      // ── Drawing helpers ────────────────────────────────────────────────
      function redrawAll() {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        for (const s of strokes) {
          drawStroke(s);
        }
      }

      function drawStroke(s: StrokeEntry) {
        if (s.tool === 'pen' || s.tool === 'eraser') {
          ctx.save();
          ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
          ctx.strokeStyle = s.tool === 'eraser' ? 'rgba(0,0,0,1)' : s.color;
          ctx.lineWidth = s.width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          for (let i = 0; i < s.points.length; i++) {
            const p = s.points[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          ctx.restore();
        } else if (s.tool === 'arrow') {
          drawArrow(s.from.x, s.from.y, s.to.x, s.to.y, s.color, s.width);
        } else if (s.tool === 'text') {
          ctx.save();
          ctx.fillStyle = s.color;
          ctx.font = `${s.size}px -apple-system, BlinkMacSystemFont, sans-serif`;
          ctx.fillText(s.value, s.x, s.y);
          ctx.restore();
        }
      }

      function drawArrow(x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
        const headLen = Math.max(12, width * 4);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // arrowhead
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // ── Pointer events ─────────────────────────────────────────────────
      canvas.addEventListener('pointerdown', (e) => {
        if (!drawMode) return;
        const x = e.clientX;
        const y = e.clientY;

        if (currentTool === 'text') {
          placeTextInput(x, y);
          return;
        }

        if (currentTool === 'sticky') {
          createStickyNote(x, y);
          return;
        }

        isDrawing = true;

        if (currentTool === 'arrow') {
          arrowStart = { x, y };
          return;
        }

        // pen or eraser
        currentPoints = [{ x, y }];
        ctx.save();
        ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = currentTool === 'eraser' ? 'rgba(0,0,0,1)' : currentColor;
        ctx.lineWidth = currentWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
      });

      canvas.addEventListener('pointermove', (e) => {
        if (!isDrawing || !drawMode) return;
        const x = e.clientX;
        const y = e.clientY;

        if (currentTool === 'arrow' && arrowStart) {
          // preview
          redrawAll();
          drawArrow(arrowStart.x, arrowStart.y, x, y, currentColor, currentWidth);
          return;
        }

        if (currentTool === 'pen' || currentTool === 'eraser') {
          currentPoints.push({ x, y });
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      });

      canvas.addEventListener('pointerup', (e) => {
        if (!isDrawing || !drawMode) return;
        isDrawing = false;
        const x = e.clientX;
        const y = e.clientY;

        if (currentTool === 'arrow' && arrowStart) {
          strokes.push({ tool: 'arrow', color: currentColor, width: currentWidth, from: { ...arrowStart }, to: { x, y } });
          arrowStart = null;
          redrawAll();
          return;
        }

        if (currentTool === 'pen' || currentTool === 'eraser') {
          ctx.restore();
          strokes.push({ tool: currentTool, color: currentColor, width: currentWidth, points: [...currentPoints] });
          currentPoints = [];
        }
      });

      // ── Text input ─────────────────────────────────────────────────────
      function placeTextInput(x: number, y: number) {
        const existing = document.getElementById('pw-draw-text-input');
        if (existing) existing.remove();

        const input = document.createElement('input');
        input.id = 'pw-draw-text-input';
        input.type = 'text';
        input.placeholder = 'Type...';
        Object.assign(input.style, {
          position: 'fixed',
          left: x + 'px',
          top: (y - 14) + 'px',
          zIndex: '100000',
          background: 'rgba(30,30,46,0.9)',
          color: currentColor,
          border: '1px solid #585b70',
          borderRadius: '3px',
          padding: '4px 8px',
          fontSize: '16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          outline: 'none',
          minWidth: '120px',
        });
        document.body.appendChild(input);

        // Defer focus so the browser finishes the pointerdown cycle first
        requestAnimationFrame(() => input.focus());

        const commitColor = currentColor;
        let committed = false;
        const commitText = () => {
          if (committed) return;
          committed = true;
          const val = input.value.trim();
          if (val) {
            strokes.push({ tool: 'text', color: commitColor, size: 16, x, y, value: val });
            redrawAll();
          }
          input.remove();
        };

        input.addEventListener('keydown', (e) => {
          e.stopPropagation(); // prevent keyboard shortcuts while typing
          if (e.key === 'Enter') {
            e.preventDefault();
            commitText();
          }
          if (e.key === 'Escape') {
            committed = true;
            input.remove();
          }
        });
        input.addEventListener('blur', () => {
          // Small delay so blur from clicking canvas doesn't race with commit
          setTimeout(commitText, 100);
        });
      }

      // ── Sticky notes ───────────────────────────────────────────────────
      function createStickyNote(x: number, y: number) {
        const bgColor = currentStickyColor;

        const sticky = document.createElement('div');
        sticky.className = 'pw-sticky';
        Object.assign(sticky.style, {
          position: 'fixed',
          left: x + 'px',
          top: y + 'px',
          width: '200px',
          minHeight: '120px',
          background: bgColor,
          borderRadius: '4px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          zIndex: '100001',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          pointerEvents: 'auto',
        });

        // Header bar (drag handle + close)
        const header = document.createElement('div');
        Object.assign(header.style, {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          cursor: 'grab',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          fontSize: '11px',
          color: 'rgba(0,0,0,0.4)',
          userSelect: 'none',
        });
        header.textContent = 'drag to move';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '\u2715';
        Object.assign(closeBtn.style, {
          background: 'none',
          border: 'none',
          fontSize: '14px',
          cursor: 'pointer',
          color: 'rgba(0,0,0,0.4)',
          padding: '0 2px',
          lineHeight: '1',
        });
        closeBtn.addEventListener('click', () => {
          sticky.remove();
          const idx = stickyNotes.indexOf(sticky);
          if (idx !== -1) stickyNotes.splice(idx, 1);
        });
        header.appendChild(closeBtn);
        sticky.appendChild(header);

        // Textarea
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Type a note...';
        Object.assign(textarea.style, {
          flex: '1',
          border: 'none',
          background: 'transparent',
          resize: 'none',
          padding: '8px',
          fontSize: '14px',
          fontFamily: 'inherit',
          outline: 'none',
          minHeight: '80px',
          color: '#1e1e2e',
        });
        textarea.addEventListener('keydown', (e) => e.stopPropagation());
        sticky.appendChild(textarea);

        document.body.appendChild(sticky);
        stickyNotes.push(sticky);

        // Focus textarea after a frame
        requestAnimationFrame(() => textarea.focus());

        // Drag logic
        let dragOffX = 0, dragOffY = 0, dragging = false;
        header.addEventListener('pointerdown', (e) => {
          dragging = true;
          dragOffX = e.clientX - sticky.getBoundingClientRect().left;
          dragOffY = e.clientY - sticky.getBoundingClientRect().top;
          header.style.cursor = 'grabbing';
          header.setPointerCapture(e.pointerId);
        });
        header.addEventListener('pointermove', (e) => {
          if (!dragging) return;
          sticky.style.left = (e.clientX - dragOffX) + 'px';
          sticky.style.top = (e.clientY - dragOffY) + 'px';
        });
        header.addEventListener('pointerup', () => {
          dragging = false;
          header.style.cursor = 'grab';
        });
      }

      // ── Keyboard shortcuts ─────────────────────────────────────────────
      document.addEventListener('keydown', (e) => {
        // Skip when typing in text input
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        if (e.key === 'd' || e.key === 'D') {
          toggleMode();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
          e.preventDefault();
          undo();
        }
      });

      // ── Init UI state ──────────────────────────────────────────────────
      updateToolButtons();
      buildColorPalette();
      updateWidthButtons();
      updateModeUI();

      // ── Cleanup on Done ────────────────────────────────────────────────
      function finish() {
        canvas.remove();
        toolbar.remove();
        border.remove();
        document.getElementById('pw-draw-text-input')?.remove();
        stickyNotes.forEach(s => s.remove());
        stickyNotes.length = 0;
        resolveDone();
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

test('Drawing Overlay — annotate the prototype', async ({ page }) => {
  await page.goto('/');

  // Inject the drawing overlay and wait for the user to click "Done"
  await injectDrawingOverlay(page);
});

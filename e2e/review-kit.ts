import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ReviewStep {
  id: string;
  note?: string;
  review?: { text: string; arrows?: string[] };
  highlights?: string[];
  action: (page: Page) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Annotation file I/O (Node side)
// ---------------------------------------------------------------------------

const ANNOTATIONS_DIR = path.join(__dirname, 'annotations');

async function setupExposedFunctions(page: Page) {
  await page.exposeFunction('pwSaveAnnotations', (stepId: string, json: string) => {
    fs.mkdirSync(ANNOTATIONS_DIR, { recursive: true });
    fs.writeFileSync(path.join(ANNOTATIONS_DIR, `${stepId}.json`), json, 'utf-8');
  });
  await page.exposeFunction('pwLoadAnnotations', (stepId: string) => {
    const fp = path.join(ANNOTATIONS_DIR, `${stepId}.json`);
    return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : null;
  });
}

// ---------------------------------------------------------------------------
// Review UI injection
// ---------------------------------------------------------------------------

async function injectReviewUI(
  page: Page,
  step: ReviewStep,
  currentIdx: number,
  totalSteps: number,
): Promise<'next' | 'back' | 'done' | 'edit'> {
  return await page.evaluate(
    ({ step, currentIdx, totalSteps }) => {
      return new Promise<'next' | 'back' | 'done' | 'edit'>((resolve) => {
        // Cleanup previous review UI and any frozen annotation overlays
        document.getElementById('pw-review-nav')?.remove();
        document.getElementById('pw-review-fab')?.remove();
        document.getElementById('pw-review-blade')?.remove();
        document.getElementById('pw-note')?.remove();
        document.getElementById('pw-review')?.remove();
        document.getElementById('pw-frozen-canvas')?.remove();
        document.getElementById('pw-draw-canvas')?.remove();
        document.querySelectorAll('.pw-frozen-sticky').forEach((el) => el.remove());
        document.querySelectorAll('.pw-sticky').forEach((el) => el.remove());
        document.querySelectorAll('.pw-highlight').forEach((el) => el.remove());
        document.querySelectorAll('.pw-review-arrow').forEach((el) => el.remove());

        let resolved = false;
        function resolveWith(action: 'next' | 'back' | 'done' | 'edit') {
          if (resolved) return;
          resolved = true;
          // Remove all review UI elements
          document.getElementById('pw-review-nav')?.remove();
          document.getElementById('pw-review-fab')?.remove();
          document.getElementById('pw-review-blade')?.remove();
          document.getElementById('pw-note')?.remove();
          document.getElementById('pw-review')?.remove();
          document.querySelectorAll('.pw-highlight').forEach((el) => el.remove());
          document.querySelectorAll('.pw-review-arrow').forEach((el) => el.remove());
          resolve(action);
        }

        // Track toggle states
        let showNotes = true;
        let showPM = true;

        // ── Navigation Bar (compact, right-aligned near FAB) ────────────
        const nav = document.createElement('div');
        nav.id = 'pw-review-nav';
        Object.assign(nav.style, {
          position: 'fixed',
          bottom: '24px',
          right: '80px',
          zIndex: '99992',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: '20px',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: '11px',
          color: '#555',
          boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.08)',
          pointerEvents: 'auto',
          userSelect: 'none',
        });

        const navBtnStyle: Partial<CSSStyleDeclaration> = {
          background: 'transparent',
          color: '#555',
          border: 'none',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          fontSize: '14px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          lineHeight: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
        };

        const backBtn = document.createElement('button');
        backBtn.innerHTML = '&#9664;';
        Object.assign(backBtn.style, navBtnStyle);
        if (currentIdx === 0) {
          backBtn.disabled = true;
          backBtn.style.opacity = '0.25';
          backBtn.style.cursor = 'default';
        }
        backBtn.addEventListener('click', () => resolveWith('back'));

        const stepLabel = document.createElement('span');
        stepLabel.textContent = `${currentIdx + 1}/${totalSteps}`;
        Object.assign(stepLabel.style, { margin: '0 4px', fontSize: '11px', color: '#888' });

        const isLast = currentIdx === totalSteps - 1;
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = isLast ? '&#10003;' : '&#9654;';
        Object.assign(nextBtn.style, navBtnStyle);
        if (isLast) nextBtn.style.color = '#22c55e';
        nextBtn.addEventListener('click', () =>
          resolveWith(isLast ? 'done' : 'next'),
        );

        nav.appendChild(backBtn);
        nav.appendChild(stepLabel);
        nav.appendChild(nextBtn);
        document.body.appendChild(nav);

        // ── FAB ──────────────────────────────────────────────────────────
        const fab = document.createElement('button');
        fab.id = 'pw-review-fab';
        fab.textContent = '\u270E';
        Object.assign(fab.style, {
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          color: '#555',
          border: '1px solid rgba(0,0,0,0.08)',
          fontSize: '18px',
          cursor: 'pointer',
          zIndex: '99990',
          boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        });
        document.body.appendChild(fab);

        // ── Menu Popover (appears above everything) ─────────────────────
        let bladeOpen = false;
        const blade = document.createElement('div');
        blade.id = 'pw-review-blade';
        Object.assign(blade.style, {
          position: 'fixed',
          bottom: '72px',
          right: '20px',
          width: '200px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          zIndex: '100010',
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.08)',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          color: '#333',
          padding: '12px',
          display: 'none',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'auto',
        });

        function toggleBlade() {
          bladeOpen = !bladeOpen;
          blade.style.display = bladeOpen ? 'flex' : 'none';
        }
        fab.addEventListener('click', toggleBlade);

        // Toggle: Designer Notes
        const notesToggle = document.createElement('label');
        Object.assign(notesToggle.style, {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          cursor: 'pointer',
        });
        const notesCb = document.createElement('input');
        notesCb.type = 'checkbox';
        notesCb.checked = true;
        notesCb.addEventListener('change', () => {
          showNotes = notesCb.checked;
          updateVisibility();
        });
        notesToggle.appendChild(notesCb);
        notesToggle.appendChild(document.createTextNode('Designer Notes'));
        blade.appendChild(notesToggle);

        // Toggle: PM Comments
        const pmToggle = document.createElement('label');
        Object.assign(pmToggle.style, {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          cursor: 'pointer',
        });
        const pmCb = document.createElement('input');
        pmCb.type = 'checkbox';
        pmCb.checked = true;
        pmCb.addEventListener('change', () => {
          showPM = pmCb.checked;
          updateVisibility();
        });
        pmToggle.appendChild(pmCb);
        pmToggle.appendChild(document.createTextNode('PM Comments'));
        blade.appendChild(pmToggle);

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit \u270F';
        Object.assign(editBtn.style, {
          background: '#f0f0f0',
          color: '#333',
          border: '1px solid #ddd',
          borderRadius: '6px',
          padding: '8px 16px',
          fontSize: '13px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          marginTop: '4px',
        });
        editBtn.addEventListener('click', () => {
          toggleBlade();
          resolveWith('edit');
        });
        blade.appendChild(editBtn);

        document.body.appendChild(blade);

        // ── Designer Note Card ───────────────────────────────────────────
        if (step.note) {
          const note = document.createElement('div');
          note.id = 'pw-note';
          note.innerHTML = `
            <div style="
              position: fixed; bottom: 80px; right: 20px; width: 340px;
              background: #f0f0f0; color: #222; border-radius: 4px;
              padding: 16px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              font-family: -apple-system, sans-serif; z-index: 99993;
              border: 1px solid #ccc;
            ">
              <div style="display: flex; justify-content: space-between; align-items: center;
                          margin-bottom: 8px;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
                            color: #666;">
                  Designer Note
                </span>
                <span style="font-size: 12px; color: #999;">
                  ${currentIdx + 1} / ${totalSteps}
                </span>
              </div>
              <div style="font-size: 14px; line-height: 1.6; color: #222;">
                ${step.note}
              </div>
            </div>
          `;
          document.body.appendChild(note);
        }

        // ── PM Review Card ───────────────────────────────────────────────
        if (step.review) {
          const review = document.createElement('div');
          review.id = 'pw-review';
          review.innerHTML = `
            <div style="
              position: fixed; bottom: ${step.note ? '270px' : '80px'}; right: 20px; width: 340px;
              background: #1a2744; color: #d0d8e8; border-radius: 4px;
              padding: 16px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              font-family: -apple-system, sans-serif; z-index: 99993;
              border: 1px solid #2a3a5c;
            ">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
                          color: #5b8bd4; margin-bottom: 8px;">
                PM Review
              </div>
              <div style="font-size: 14px; line-height: 1.6;">
                ${step.review.text}
              </div>
            </div>
          `;
          document.body.appendChild(review);

          // Review arrows (blue, pointing at buttons)
          if (step.review.arrows) {
            for (const buttonName of step.review.arrows) {
              const buttons = Array.from(document.querySelectorAll('button'));
              const target = buttons.find(
                (b) => b.textContent?.trim() === buttonName,
              );
              if (!target) continue;

              const rect = target.getBoundingClientRect();
              const arrow = document.createElement('div');
              arrow.className = 'pw-review-arrow';
              const cy = rect.top + rect.height / 2;
              Object.assign(arrow.style, {
                position: 'fixed',
                top: cy - 40 + 'px',
                left: rect.right + 50 + 'px',
                width: '180px',
                height: '80px',
                pointerEvents: 'none',
                zIndex: '99998',
              });
              arrow.innerHTML = `<svg width="180" height="80" viewBox="0 0 180 80" xmlns="http://www.w3.org/2000/svg">
                <polygon points="0,40 60,10 60,28 180,28 180,52 60,52 60,70" fill="#5b8bd4"/>
              </svg>`;
              document.body.appendChild(arrow);
            }
          }
        }

        // ── Highlight Arrows (gray, pointing at field labels) ────────────
        if (step.highlights) {
          for (const label of step.highlights) {
            const labels = Array.from(document.querySelectorAll('label'));
            const target = labels.find((l) => l.textContent?.includes(label));
            if (!target) continue;

            const field =
              target.closest('.MuiFormControl-root') || target.parentElement;
            if (!field) continue;

            const rect = field.getBoundingClientRect();
            const arrow = document.createElement('div');
            arrow.className = 'pw-highlight';
            const cy = rect.top + rect.height / 2;
            Object.assign(arrow.style, {
              position: 'fixed',
              top: cy - 40 + 'px',
              left: rect.right + 50 + 'px',
              width: '180px',
              height: '80px',
              pointerEvents: 'none',
              zIndex: '99998',
            });
            arrow.innerHTML = `<svg width="180" height="80" viewBox="0 0 180 80" xmlns="http://www.w3.org/2000/svg">
              <polygon points="0,40 60,10 60,28 180,28 180,52 60,52 60,70" fill="#aaa"/>
            </svg>`;
            document.body.appendChild(arrow);
          }
        }

        // ── Visibility toggle helper ─────────────────────────────────────
        function updateVisibility() {
          const noteEl = document.getElementById('pw-note');
          if (noteEl) noteEl.style.display = showNotes ? '' : 'none';

          const reviewEl = document.getElementById('pw-review');
          if (reviewEl) reviewEl.style.display = showPM ? '' : 'none';

          document.querySelectorAll('.pw-review-arrow').forEach((el) => {
            (el as HTMLElement).style.display = showPM ? '' : 'none';
          });
        }

        // ── Load & display saved annotations (frozen, non-interactive) ──
        (async () => {
          try {
            const saved = await (window as any).pwLoadAnnotations(step.id);
            if (!saved) return;
            const data = JSON.parse(saved);
            if (data.strokes?.length || data.stickies?.length) {
              const dpr = window.devicePixelRatio || 1;
              // Frozen canvas for strokes
              if (data.strokes?.length) {
                const fc = document.createElement('canvas');
                fc.id = 'pw-frozen-canvas';
                Object.assign(fc.style, {
                  position: 'fixed', top: '0', left: '0',
                  width: innerWidth + 'px', height: innerHeight + 'px',
                  zIndex: '99995', pointerEvents: 'none',
                });
                fc.width = innerWidth * dpr;
                fc.height = innerHeight * dpr;
                document.body.appendChild(fc);
                const fctx = fc.getContext('2d')!;
                fctx.scale(dpr, dpr);
                for (const s of data.strokes) {
                  if (s.tool === 'pen') {
                    fctx.save();
                    fctx.strokeStyle = s.color;
                    fctx.lineWidth = s.width;
                    fctx.lineCap = 'round'; fctx.lineJoin = 'round';
                    fctx.beginPath();
                    for (let i = 0; i < s.points.length; i++) {
                      if (i === 0) fctx.moveTo(s.points[i].x, s.points[i].y);
                      else fctx.lineTo(s.points[i].x, s.points[i].y);
                    }
                    fctx.stroke(); fctx.restore();
                  } else if (s.tool === 'arrow') {
                    const headLen = Math.max(12, s.width * 4);
                    const angle = Math.atan2(s.to.y - s.from.y, s.to.x - s.from.x);
                    fctx.save();
                    fctx.strokeStyle = s.color; fctx.fillStyle = s.color;
                    fctx.lineWidth = s.width; fctx.lineCap = 'round';
                    fctx.beginPath(); fctx.moveTo(s.from.x, s.from.y); fctx.lineTo(s.to.x, s.to.y); fctx.stroke();
                    fctx.beginPath(); fctx.moveTo(s.to.x, s.to.y);
                    fctx.lineTo(s.to.x - headLen * Math.cos(angle - Math.PI / 6), s.to.y - headLen * Math.sin(angle - Math.PI / 6));
                    fctx.lineTo(s.to.x - headLen * Math.cos(angle + Math.PI / 6), s.to.y - headLen * Math.sin(angle + Math.PI / 6));
                    fctx.closePath(); fctx.fill(); fctx.restore();
                  } else if (s.tool === 'text') {
                    fctx.save(); fctx.fillStyle = s.color;
                    fctx.font = `${s.size}px -apple-system, BlinkMacSystemFont, sans-serif`;
                    fctx.fillText(s.value, s.x, s.y); fctx.restore();
                  }
                }
              }
              // Frozen stickies
              if (data.stickies?.length) {
                for (const st of data.stickies) {
                  const div = document.createElement('div');
                  div.className = 'pw-frozen-sticky';
                  Object.assign(div.style, {
                    position: 'fixed', left: st.x + 'px', top: st.y + 'px',
                    width: (st.width || 200) + 'px', minHeight: '60px',
                    background: st.color || '#fef08a', borderRadius: '4px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)', zIndex: '99996',
                    padding: '8px 10px', fontSize: '14px', color: '#1e1e2e',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                    pointerEvents: 'none', whiteSpace: 'pre-wrap',
                  });
                  div.textContent = st.text || '';
                  document.body.appendChild(div);
                }
              }
            }
          } catch (_) { /* ignore load errors */ }
        })();
      });
    },
    { step: { id: step.id, note: step.note, review: step.review, highlights: step.highlights }, currentIdx, totalSteps },
  );
}

// ---------------------------------------------------------------------------
// Drawing overlay injection (ported from drawing-demo.spec.ts)
// ---------------------------------------------------------------------------

async function injectDrawingOverlay(page: Page, stepId: string): Promise<void> {
  await page.evaluate((stepId: string) => {
    return new Promise<void>(async (resolveOverlay) => {
      // ── Clean up frozen overlays from previous edit sessions ──────────
      document.getElementById('pw-draw-canvas')?.remove();
      document.getElementById('pw-frozen-canvas')?.remove();
      document.querySelectorAll('.pw-frozen-sticky').forEach(el => el.remove());
      document.querySelectorAll('.pw-sticky').forEach(el => el.remove());

      const dpr = window.devicePixelRatio || 1;

      // ── State ──────────────────────────────────────────────────────────
      type StrokeEntry =
        | { tool: 'pen'; color: string; width: number; points: { x: number; y: number }[] }
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

      // ── Load saved annotations ─────────────────────────────────────────
      const saved = await (window as any).pwLoadAnnotations(stepId);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (Array.isArray(data.strokes)) {
            for (const s of data.strokes) strokes.push(s);
          }
          // Stickies will be recreated as DOM elements after canvas is set up
          var savedStickies: Array<{ x: number; y: number; width: number; text: string; color: string }> = data.stickies || [];
        } catch (_) {
          var savedStickies: Array<{ x: number; y: number; width: number; text: string; color: string }> = [];
        }
      } else {
        var savedStickies: Array<{ x: number; y: number; width: number; text: string; color: string }> = [];
      }

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

      // --- Color palette container ---
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

      // --- Save / Discard (instead of Done) ---
      toolbar.appendChild(makeBtn('Save', saveAndFinish, {
        background: '#a6e3a1',
        color: '#1e1e2e',
        fontWeight: '600',
      }));
      toolbar.appendChild(makeBtn('Discard', discardAndFinish, {
        background: '#585b70',
        color: '#cdd6f4',
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
        canvas.style.cursor = tool === 'eraser' ? 'not-allowed' : (tool === 'text' || tool === 'sticky') ? 'cell' : 'crosshair';
        updateToolButtons();
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
        if (s.tool === 'pen') {
          ctx.save();
          ctx.strokeStyle = s.color;
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
          drawArrowShape(s.from.x, s.from.y, s.to.x, s.to.y, s.color, s.width);
        } else if (s.tool === 'text') {
          ctx.save();
          ctx.fillStyle = s.color;
          ctx.font = `${s.size}px -apple-system, BlinkMacSystemFont, sans-serif`;
          ctx.fillText(s.value, s.x, s.y);
          ctx.restore();
        }
      }

      function drawArrowShape(x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
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

      // ── Hit-testing for object eraser ──────────────────────────────────
      const HIT_RADIUS = 20;

      function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
        const dx = bx - ax, dy = by - ay;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - ax, py - ay);
        let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      }

      function hitTestStroke(x: number, y: number, s: StrokeEntry): boolean {
        const threshold = HIT_RADIUS;
        if (s.tool === 'pen') {
          for (let i = 1; i < s.points.length; i++) {
            if (distToSegment(x, y, s.points[i - 1].x, s.points[i - 1].y, s.points[i].x, s.points[i].y) < threshold) return true;
          }
          if (s.points.length === 1 && Math.hypot(x - s.points[0].x, y - s.points[0].y) < threshold) return true;
          return false;
        }
        if (s.tool === 'arrow') {
          // Check line body
          if (distToSegment(x, y, s.from.x, s.from.y, s.to.x, s.to.y) < threshold) return true;
          // Also check arrowhead area (circle around tip)
          if (Math.hypot(x - s.to.x, y - s.to.y) < threshold * 1.5) return true;
          if (Math.hypot(x - s.from.x, y - s.from.y) < threshold) return true;
          return false;
        }
        if (s.tool === 'text') {
          const textWidth = Math.max(s.value.length * s.size * 0.6, 40);
          const pad = 8;
          return x >= s.x - pad && x <= s.x + textWidth + pad && y >= s.y - s.size - pad && y <= s.y + pad;
        }
        return false;
      }

      function hitTestSticky(x: number, y: number): number {
        for (let i = stickyNotes.length - 1; i >= 0; i--) {
          const rect = stickyNotes[i].getBoundingClientRect();
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return i;
        }
        return -1;
      }

      function eraseAtPoint(x: number, y: number): boolean {
        // Check stickies first (they're on top)
        const stickyIdx = hitTestSticky(x, y);
        if (stickyIdx !== -1) {
          stickyNotes[stickyIdx].remove();
          stickyNotes.splice(stickyIdx, 1);
          return true;
        }
        // Check strokes in reverse order (topmost first)
        for (let i = strokes.length - 1; i >= 0; i--) {
          if (hitTestStroke(x, y, strokes[i])) {
            strokes.splice(i, 1);
            redrawAll();
            return true;
          }
        }
        return false;
      }

      // ── Pointer events ─────────────────────────────────────────────────
      let isErasing = false;

      canvas.addEventListener('pointerdown', (e) => {
        if (!drawMode) return;
        const x = e.clientX;
        const y = e.clientY;

        if (currentTool === 'eraser') {
          isErasing = true;
          eraseAtPoint(x, y);
          return;
        }

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

        // pen
        currentPoints = [{ x, y }];
        ctx.save();
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
      });

      canvas.addEventListener('pointermove', (e) => {
        if (!drawMode) return;
        const x = e.clientX;
        const y = e.clientY;

        // Drag-to-erase: continuously erase objects under cursor
        if (isErasing && currentTool === 'eraser') {
          eraseAtPoint(x, y);
          return;
        }

        if (!isDrawing) return;

        if (currentTool === 'arrow' && arrowStart) {
          redrawAll();
          drawArrowShape(arrowStart.x, arrowStart.y, x, y, currentColor, currentWidth);
          return;
        }

        if (currentTool === 'pen') {
          currentPoints.push({ x, y });
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      });

      canvas.addEventListener('pointerup', (e) => {
        if (isErasing) { isErasing = false; return; }
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

        if (currentTool === 'pen') {
          ctx.restore();
          strokes.push({ tool: 'pen', color: currentColor, width: currentWidth, points: [...currentPoints] });
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
          e.stopPropagation();
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
          setTimeout(commitText, 100);
        });
      }

      // ── Sticky notes ───────────────────────────────────────────────────
      function createStickyNote(x: number, y: number, prefill?: { width: number; text: string; color: string }) {
        const bgColor = prefill?.color || currentStickyColor;

        const sticky = document.createElement('div');
        sticky.className = 'pw-sticky';
        Object.assign(sticky.style, {
          position: 'fixed',
          left: x + 'px',
          top: y + 'px',
          width: (prefill?.width || 200) + 'px',
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
        if (prefill?.text) textarea.value = prefill.text;
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

        if (!prefill) {
          requestAnimationFrame(() => textarea.focus());
        }

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
      function keyHandler(e: KeyboardEvent) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        if (e.key === 'd' || e.key === 'D') {
          toggleMode();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
          e.preventDefault();
          undo();
        }
      }
      document.addEventListener('keydown', keyHandler);

      // ── Init UI state ──────────────────────────────────────────────────
      updateToolButtons();
      buildColorPalette();
      updateWidthButtons();
      updateModeUI();

      // ── Restore saved strokes + stickies ───────────────────────────────
      redrawAll();
      for (const s of savedStickies) {
        createStickyNote(s.x, s.y, { width: s.width, text: s.text, color: s.color });
      }

      // ── Cleanup helpers ────────────────────────────────────────────────
      function removeOverlayFull() {
        canvas.remove();
        toolbar.remove();
        border.remove();
        document.getElementById('pw-draw-text-input')?.remove();
        stickyNotes.forEach((s) => s.remove());
        stickyNotes.length = 0;
        document.removeEventListener('keydown', keyHandler);
      }

      /** Keep canvas + stickies visible but non-interactive (after Save) */
      function freezeOverlay() {
        toolbar.remove();
        border.remove();
        document.getElementById('pw-draw-text-input')?.remove();
        document.removeEventListener('keydown', keyHandler);
        // Canvas stays visible but non-interactive
        canvas.style.pointerEvents = 'none';
        canvas.style.cursor = 'default';
        // Stickies stay visible but non-interactive
        stickyNotes.forEach((s) => {
          s.style.pointerEvents = 'none';
          const ta = s.querySelector('textarea') as HTMLTextAreaElement;
          if (ta) { ta.readOnly = true; ta.style.cursor = 'default'; }
          const hdr = s.querySelector('div') as HTMLElement;
          if (hdr) hdr.style.cursor = 'default';
          const closeBtn = s.querySelector('button');
          if (closeBtn) closeBtn.style.display = 'none';
        });
      }

      async function saveAndFinish() {
        // Serialize stickies from DOM
        const stickyData = stickyNotes.map((el) => {
          const ta = el.querySelector('textarea') as HTMLTextAreaElement;
          return {
            x: parseFloat(el.style.left),
            y: parseFloat(el.style.top),
            width: parseFloat(el.style.width),
            text: ta?.value || '',
            color: el.style.background,
          };
        });
        const json = JSON.stringify({ strokes, stickies: stickyData });
        await (window as any).pwSaveAnnotations(stepId, json);
        freezeOverlay();
        resolveOverlay();
      }

      function discardAndFinish() {
        removeOverlayFull();
        resolveOverlay();
      }
    });
  }, stepId);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runReview(page: Page, steps: ReviewStep[]): Promise<void> {
  await setupExposedFunctions(page);

  let current = 0;
  while (current >= 0 && current < steps.length) {
    await page.goto('/');
    for (let i = 0; i <= current; i++) {
      await steps[i].action(page);
    }

    let action: 'next' | 'back' | 'done' | 'edit';
    do {
      action = await injectReviewUI(page, steps[current], current, steps.length);
      if (action === 'edit') {
        await injectDrawingOverlay(page, steps[current].id);
      }
    } while (action === 'edit');

    if (action === 'next') current++;
    else if (action === 'back') current = Math.max(0, current - 1);
    else break; // 'done'
  }
}

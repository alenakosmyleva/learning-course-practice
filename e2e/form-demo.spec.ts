import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Annotation helpers — overlay with built-in Next button that controls Playwright
// ---------------------------------------------------------------------------

/** Show a designer note with a "Next →" button. Returns a promise that
 *  resolves when the user clicks the button — no Inspector needed. */
async function step(page: Page, text: string, current: number, total: number) {
  await page.evaluate(({ text, current, total }) => {
    document.getElementById('pw-note')?.remove();

    const note = document.createElement('div');
    note.id = 'pw-note';
    note.innerHTML = `
      <div style="
        position: fixed; bottom: 20px; right: 20px; width: 340px;
        background: #f0f0f0; color: #222; border-radius: 4px;
        padding: 16px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-family: -apple-system, sans-serif; z-index: 99999;
        border: 1px solid #ccc;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 8px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
                      color: #666;">
            Designer Note
          </span>
          <span style="font-size: 12px; color: #999;">
            ${current} / ${total}
          </span>
        </div>

        <div style="font-size: 14px; line-height: 1.6; color: #222; margin-bottom: 14px;">
          ${text}
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button id="pw-next" style="
            background: transparent; color: #222; border: 1.5px solid #222;
            border-radius: 4px; padding: 6px 18px; font-size: 13px;
            font-weight: 500; cursor: pointer;
          ">
            ${current < total ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(note);
  }, { text, current, total });

  // Wait for the REAL user to click "Next" — Playwright blocks here
  await page.evaluate(() => {
    return new Promise<void>(resolve => {
      document.getElementById('pw-next')!
        .addEventListener('click', () => resolve(), { once: true });
    });
  });

  // Clean up after click
  await page.evaluate(() => {
    document.getElementById('pw-note')?.remove();
    document.getElementById('pw-review')?.remove();
    document.querySelectorAll('.pw-highlight').forEach(el => el.remove());
    document.querySelectorAll('.pw-review-arrow').forEach(el => el.remove());
  });
}

async function highlight(page: Page, label: string) {
  await page.evaluate((label) => {
    document.querySelectorAll('.pw-highlight').forEach(el => el.remove());

    const labels = Array.from(document.querySelectorAll('label'));
    const target = labels.find(l => l.textContent?.includes(label));
    if (!target) return;

    const field = target.closest('.MuiFormControl-root') || target.parentElement;
    if (!field) return;

    const rect = field.getBoundingClientRect();

    // SVG arrow pointing from the right toward the field
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
  }, label);
}

/** Show a PM review note (dark blue card) positioned above the designer card. */
async function reviewNote(page: Page, text: string) {
  await page.evaluate((text) => {
    document.getElementById('pw-review')?.remove();

    const review = document.createElement('div');
    review.id = 'pw-review';
    review.innerHTML = `
      <div style="
        position: fixed; bottom: 190px; right: 20px; width: 340px;
        background: #1a2744; color: #d0d8e8; border-radius: 4px;
        padding: 16px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        font-family: -apple-system, sans-serif; z-index: 99999;
        border: 1px solid #2a3a5c;
      ">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
                    color: #5b8bd4; margin-bottom: 8px;">
          PM Review
        </div>
        <div style="font-size: 14px; line-height: 1.6;">
          ${text}
        </div>
      </div>
    `;
    document.body.appendChild(review);
  }, text);
}

/** Blue arrow pointing at a button by its name. */
async function reviewArrow(page: Page, buttonName: string) {
  await page.evaluate((buttonName) => {
    document.querySelectorAll('.pw-review-arrow').forEach(el => el.remove());

    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find(b => b.textContent?.trim() === buttonName);
    if (!target) return;

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
  }, buttonName);
}

// ---------------------------------------------------------------------------
// Flow 1: Happy path
// ---------------------------------------------------------------------------

test('Demo: Happy path — fill all fields and submit', async ({ page }) => {
  const T = 6;
  await page.goto('/');

  await step(page, `
    This is the <b>Contact Form</b> feature.<br><br>
    The form collects basic lead information.
    Let's walk through the happy path.
  `, 1, T);

  await page.getByRole('button', { name: 'Form' }).click();
  await expect(page.getByText('Contact Form')).toBeVisible();

  await highlight(page, 'Email');
  await step(page, `
    The form has 5 fields. <b>Email is required</b> (marked with *).<br><br>
    All fields are standard MUI TextFields — consistent with the design system.
  `, 2, T);

  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Email').fill('john.doe@example.com');

  await step(page, `
    Name and Email filled.<br><br>
    <b>Design decision:</b> email goes right after name because
    it's the most important field for sales follow-up.
  `, 3, T);

  await page.getByLabel('Phone').fill('+1-555-123-4567');
  await page.getByLabel('Company').fill('Acme Corp');

  await step(page, `
    Phone and Company are <b>optional</b> — we don't want
    to create friction for users who just want to leave a quick message.
  `, 4, T);

  await page.getByLabel('Message').fill('Hello, I would like to learn more about your services.');

  await step(page, `
    Message field uses <b>4 rows</b> — enough space for a
    meaningful message without overwhelming the form visually.
    <br><br>All filled — ready to submit.
  `, 5, T);

  await page.getByRole('button', { name: 'Submit' }).click();

  await step(page, `
    <b>Form submitted successfully.</b><br><br>
    End of happy path. The form resets and shows a confirmation (TBD).
  `, 6, T);
});

// ---------------------------------------------------------------------------
// Flow 2: Validation error
// ---------------------------------------------------------------------------

test('Demo: Validation — submit without email shows error', async ({ page }) => {
  const T = 4;
  await page.goto('/');
  await page.getByRole('button', { name: 'Form' }).click();
  await expect(page.getByText('Contact Form')).toBeVisible();

  await step(page, `
    <b>Validation flow:</b> what happens when the user
    forgets to fill in the required Email field?
  `, 1, T);

  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Phone').fill('+1-555-123-4567');
  await page.getByLabel('Company').fill('Acme Corp');
  await page.getByLabel('Message').fill('Hello, I would like to learn more about your services.');

  await highlight(page, 'Email');
  await step(page, `
    All fields filled <b>except Email</b>.<br><br>
    Notice the asterisk (*) — it signals the field is required,
    but we don't block input on other fields.
  `, 2, T);

  await page.getByRole('button', { name: 'Submit' }).click();

  await highlight(page, 'Email');
  await reviewArrow(page, 'Submit');
  await reviewNote(page, `
    Submit button is still active while the form has a validation error.
    I think it should be <b>disabled</b> when required fields are not filled.
  `);
  await step(page, `
    <b>"Email is required"</b> — inline error appears
    under the field.<br><br>
    <b>Design decision:</b> we use inline validation (not a toast/modal)
    so the user sees exactly which field needs attention.
  `, 3, T);

  await step(page, `
    End of validation flow.<br><br>
    <b>Next steps:</b> add email format validation,
    success confirmation screen, loading state on submit.
  `, 4, T);
});

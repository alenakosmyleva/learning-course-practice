import { test, expect } from '@playwright/test';
import { runReview, ReviewStep } from './review-kit';

// ---------------------------------------------------------------------------
// Happy-path steps
// ---------------------------------------------------------------------------

const happyPathSteps: ReviewStep[] = [
  {
    id: 'happy-1-intro',
    action: async () => {},
    note: `
      This is the <b>Contact Form</b> feature.<br><br>
      The form collects basic lead information.
      Let's walk through the happy path.
    `,
  },
  {
    id: 'happy-2-form-overview',
    action: async (page) => {
      await page.getByRole('button', { name: 'Form' }).click();
      await expect(page.getByText('Contact Form')).toBeVisible();
    },
    highlights: ['Email'],
    note: `
      The form has 5 fields. <b>Email is required</b> (marked with *).<br><br>
      All fields are standard MUI TextFields — consistent with the design system.
    `,
  },
  {
    id: 'happy-3-name-email',
    action: async (page) => {
      await page.getByLabel('Name').fill('John Doe');
      await page.getByLabel('Email').fill('john.doe@example.com');
    },
    note: `
      Name and Email filled.<br><br>
      <b>Design decision:</b> email goes right after name because
      it's the most important field for sales follow-up.
    `,
  },
  {
    id: 'happy-4-phone-company',
    action: async (page) => {
      await page.getByLabel('Phone').fill('+1-555-123-4567');
      await page.getByLabel('Company').fill('Acme Corp');
    },
    note: `
      Phone and Company are <b>optional</b> — we don't want
      to create friction for users who just want to leave a quick message.
    `,
  },
  {
    id: 'happy-5-message',
    action: async (page) => {
      await page.getByLabel('Message').fill('Hello, I would like to learn more about your services.');
    },
    note: `
      Message field uses <b>4 rows</b> — enough space for a
      meaningful message without overwhelming the form visually.
      <br><br>All filled — ready to submit.
    `,
  },
  {
    id: 'happy-6-submit',
    action: async (page) => {
      await page.getByRole('button', { name: 'Submit' }).click();
    },
    note: `
      <b>Form submitted successfully.</b><br><br>
      End of happy path. The form resets and shows a confirmation (TBD).
    `,
  },
];

// ---------------------------------------------------------------------------
// Validation steps
// ---------------------------------------------------------------------------

const validationSteps: ReviewStep[] = [
  {
    id: 'val-1-intro',
    action: async (page) => {
      await page.getByRole('button', { name: 'Form' }).click();
      await expect(page.getByText('Contact Form')).toBeVisible();
    },
    note: `
      <b>Validation flow:</b> what happens when the user
      forgets to fill in the required Email field?
    `,
  },
  {
    id: 'val-2-fill-no-email',
    action: async (page) => {
      await page.getByLabel('Name').fill('John Doe');
      await page.getByLabel('Phone').fill('+1-555-123-4567');
      await page.getByLabel('Company').fill('Acme Corp');
      await page.getByLabel('Message').fill('Hello, I would like to learn more about your services.');
    },
    highlights: ['Email'],
    note: `
      All fields filled <b>except Email</b>.<br><br>
      Notice the asterisk (*) — it signals the field is required,
      but we don't block input on other fields.
    `,
  },
  {
    id: 'val-3-submit-error',
    action: async (page) => {
      await page.getByRole('button', { name: 'Submit' }).click();
    },
    highlights: ['Email'],
    note: `
      <b>"Email is required"</b> — inline error appears
      under the field.<br><br>
      <b>Design decision:</b> we use inline validation (not a toast/modal)
      so the user sees exactly which field needs attention.
    `,
  },
  {
    id: 'val-4-end',
    action: async () => {},
    note: `
      End of validation flow.<br><br>
      <b>Next steps:</b> add email format validation,
      success confirmation screen, loading state on submit.
    `,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('Review: Happy path — fill all fields and submit', async ({ page }) => {
  await runReview(page, happyPathSteps);
});

test('Review: Validation — submit without email shows error', async ({ page }) => {
  await runReview(page, validationSteps);
});

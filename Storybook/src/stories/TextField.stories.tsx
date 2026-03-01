import type { Meta, StoryObj } from '@storybook/react';
import { TextField, Stack, Button } from '@mui/material';

const meta: Meta<typeof TextField> = {
  title: 'Components/TextField',
  component: TextField,
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {
  args: {
    label: 'Label',
    placeholder: 'Enter text...',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    helperText: 'We will never share your email',
  },
};

export const ErrorState: Story = {
  args: {
    label: 'Email',
    value: 'invalid-email',
    error: true,
    helperText: 'Please enter a valid email address',
  },
};

export const FormExample: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 400 }}>
      <TextField label="First Name" placeholder="John" />
      <TextField label="Last Name" placeholder="Doe" />
      <TextField label="Email" placeholder="john@example.com" type="email" />
      <TextField label="Password" type="password" />
      <Button variant="contained" size="large">Submit</Button>
    </Stack>
  ),
};

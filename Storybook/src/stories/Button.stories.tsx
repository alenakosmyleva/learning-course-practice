import type { Meta, StoryObj } from '@storybook/react';
import { Button, Stack } from '@mui/material';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['contained', 'outlined', 'text'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Contained: Story = {
  args: {
    variant: 'contained',
    children: 'Contained Button',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: 'Outlined Button',
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    children: 'Text Button',
  },
};

export const Primary: Story = {
  args: {
    variant: 'contained',
    color: 'primary',
    children: 'Primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'contained',
    color: 'secondary',
    children: 'Secondary',
  },
};

export const AllVariants: Story = {
  render: () => (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" color="primary">Primary</Button>
        <Button variant="contained" color="secondary">Secondary</Button>
        <Button variant="outlined" color="primary">Outlined</Button>
        <Button variant="outlined" color="secondary">Outlined</Button>
        <Button variant="text" color="primary">Text</Button>
      </Stack>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" size="small">Small</Button>
        <Button variant="contained" size="medium">Medium</Button>
        <Button variant="contained" size="large">Large</Button>
      </Stack>
    </Stack>
  ),
};

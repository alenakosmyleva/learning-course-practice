import type { Meta, StoryObj } from '@storybook/react';
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Stack,
} from '@mui/material';

const meta: Meta<typeof Radio> = {
  title: 'Components/RadioButton',
  component: Radio,
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'error', 'info', 'success', 'warning'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Radio>;

export const Default: Story = {
  args: {
    defaultChecked: true,
    color: 'primary',
  },
};

export const Group: Story = {
  render: () => (
    <FormControl>
      <FormLabel>Favorite framework</FormLabel>
      <RadioGroup defaultValue="react">
        <FormControlLabel value="react" control={<Radio />} label="React" />
        <FormControlLabel value="vue" control={<Radio />} label="Vue" />
        <FormControlLabel value="angular" control={<Radio />} label="Angular" />
        <FormControlLabel value="svelte" control={<Radio />} label="Svelte" />
      </RadioGroup>
    </FormControl>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <Radio defaultChecked color="primary" />
      <Radio defaultChecked color="secondary" />
      <Radio defaultChecked color="error" />
      <Radio defaultChecked color="info" />
      <Radio defaultChecked color="success" />
      <Radio defaultChecked color="warning" />
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <Radio defaultChecked size="small" />
      <Radio defaultChecked size="medium" />
    </Stack>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <Radio disabled />
      <Radio disabled defaultChecked />
    </Stack>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
} from '@mui/material';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card sx={{ maxWidth: 345 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Card Title
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This is a basic card component styled by the custom theme.
          It demonstrates border radius, shadow, and typography.
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small">Learn More</Button>
        <Button size="small" variant="contained">Action</Button>
      </CardActions>
    </Card>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
      {[
        { title: 'Revenue', value: '$24,500', change: '+12%' },
        { title: 'Users', value: '1,234', change: '+8%' },
        { title: 'Orders', value: '456', change: '+23%' },
      ].map((item) => (
        <Card key={item.title}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              {item.title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {item.value}
            </Typography>
            <Typography variant="body2" color="primary">
              {item.change} from last month
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  ),
};

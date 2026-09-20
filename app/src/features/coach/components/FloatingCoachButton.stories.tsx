import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FloatingCoachButton } from './FloatingCoachButton';

const meta = {
  title: 'Features/Coach/FloatingCoachButton',
  component: FloatingCoachButton,
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof FloatingCoachButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

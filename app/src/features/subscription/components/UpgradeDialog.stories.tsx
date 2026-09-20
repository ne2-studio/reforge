import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { UpgradeDialog } from './UpgradeDialog';

const meta = {
  title: 'Features/Subscription/UpgradeDialog',
  component: UpgradeDialog,
  args: {
    open: true,
    onOpenChange: fn(),
    isUpgrading: false,
    onConfirm: fn(),
  },
} satisfies Meta<typeof UpgradeDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Upgrading: Story = {
  args: {
    isUpgrading: true,
  },
};

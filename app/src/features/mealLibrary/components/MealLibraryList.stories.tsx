import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { MealLibraryList } from './MealLibraryList';
import { MealLibraryItem } from '@/types';

const items = [
  new MealLibraryItem({
    id: 'library-1',
    title: 'Pollo con arroz',
    description: 'Pechuga de pollo a la plancha con arroz blanco',
    category: 'lunch',
    calories: 600,
    protein: 50,
    carbs: 60,
    fats: 15,
  }),
  new MealLibraryItem({
    id: 'library-2',
    title: 'Avena con fruta',
    description: 'Avena con plátano y arándanos',
    category: 'breakfast',
    calories: 350,
    protein: 12,
    carbs: 55,
    fats: 8,
  }),
];

const meta = {
  title: 'Features/MealLibrary/MealLibraryList',
  component: MealLibraryList,
  args: {
    items,
    isLoading: false,
    onDelete: fn(),
  },
} satisfies Meta<typeof MealLibraryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    items: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    items: [],
    isLoading: false,
  },
};

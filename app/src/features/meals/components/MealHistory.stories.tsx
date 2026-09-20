import type { Meta, StoryObj } from '@storybook/react-vite';
import { MealHistory } from './MealHistory';
import { Meal } from '@/types';

const meals = [
  new Meal({
    id: 'meal-2',
    mealText: 'Yogur con avena',
    category: 'breakfast',
    time: '08:00',
    calories: 350,
    protein: 20,
    carbs: 40,
    fats: 10,
    feedback: null,
    extraData: null,
    timestamp: '2026-01-08T08:00:00.000Z',
    date: '2026-01-08',
  }),
  new Meal({
    id: 'meal-1',
    mealText: 'Pollo con arroz',
    category: 'lunch',
    time: '13:30',
    calories: 500,
    protein: 40,
    carbs: 50,
    fats: 10,
    feedback: null,
    extraData: null,
    timestamp: '2026-01-07T13:30:00.000Z',
    date: '2026-01-07',
  }),
];

const meta = {
  title: 'Features/History/MealHistory',
  component: MealHistory,
  args: {
    meals: [],
    isLoading: false,
  },
} satisfies Meta<typeof MealHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithHistory: Story = {
  args: {
    meals,
  },
};

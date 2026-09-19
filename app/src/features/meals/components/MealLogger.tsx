import { useState } from 'react';
import { Button } from '@/design-system/components/ui/button';
import { Textarea } from '@/design-system/components/ui/textarea';
import { Label } from '@/design-system/components/ui/label';
import { Input } from '@/design-system/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/components/ui/card';
import { Utensils, Clock, Check, Loader2 } from 'lucide-react';
import type { SaveMealData } from '@/types';

const CATEGORIES = [
  { value: 'breakfast', label: '🌅 Desayuno' },
  { value: 'mid-morning', label: '☕ Media mañana' },
  { value: 'lunch', label: '☀️ Comida' },
  { value: 'snack', label: '🍎 Merienda' },
  { value: 'dinner', label: '🌙 Cena' },
];

// Determines the meal category based on the current time, same buckets as the source
// reforge-frontend's MealLogger.
function getDefaultCategory(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 13) return 'mid-morning';
  if (hour >= 13 && hour < 17) return 'lunch';
  if (hour >= 17 && hour < 20) return 'snack';
  return 'dinner';
}

function getDefaultTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

interface ManualFields {
  mealText: string;
  category: string;
  time: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
}

function emptyFields(): ManualFields {
  return {
    mealText: '',
    category: getDefaultCategory(),
    time: getDefaultTime(),
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  };
}

interface MealLoggerProps {
  isSaving: boolean;
  onSave: (data: SaveMealData) => void;
}

// Presentational — no react-router-dom/store/useCases imports. Manual-entry-only meal form,
// ported from reforge-frontend/src/components/MealLogger.tsx's `"manual"` mode: the `"new"`
// (AI text analysis) and `"library"` (meal library) tabs are dropped entirely, since neither
// exists yet (Slice 8/9, Slice 3), and so are the AI-usage-limit props that only made sense
// alongside the `"new"` tab.
export function MealLogger({ isSaving, onSave }: MealLoggerProps) {
  const [fields, setFields] = useState<ManualFields>(emptyFields);

  const updateField = (field: keyof ManualFields, value: string) => {
    setFields({ ...fields, [field]: value });
  };

  const isValid =
    fields.mealText.trim() !== '' &&
    fields.calories !== '' &&
    fields.protein !== '' &&
    fields.carbs !== '' &&
    fields.fats !== '';

  const handleSave = () => {
    if (!isValid) return;

    onSave({
      mealText: fields.mealText,
      category: fields.category,
      time: fields.time,
      calories: parseFloat(fields.calories),
      protein: parseFloat(fields.protein),
      carbs: parseFloat(fields.carbs),
      fats: parseFloat(fields.fats),
      feedback: null,
      extraData: null,
    });
    setFields(emptyFields());
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          Registrar comida
        </CardTitle>
        <CardDescription>Introduce los valores nutricionales manualmente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Tipo</Label>
            <Select value={fields.category} onValueChange={(v) => updateField('category', v)}>
              <SelectTrigger id="category" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Hora</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                id="time"
                type="time"
                value={fields.time}
                onChange={(e) => updateField('time', e.target.value)}
                className="w-full h-12 pl-11 pr-3 border-2 border-input rounded-lg bg-input text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mealText">Descripción</Label>
          <Textarea
            id="mealText"
            placeholder='Ej: "2 huevos revueltos con aguacate y 2 tostadas"'
            value={fields.mealText}
            onChange={(e) => updateField('mealText', e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calories">Calorías (kcal)</Label>
            <Input
              id="calories"
              type="number"
              step="1"
              placeholder="500"
              value={fields.calories}
              onChange={(e) => updateField('calories', e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein">Proteína (g)</Label>
            <Input
              id="protein"
              type="number"
              step="0.1"
              placeholder="30"
              value={fields.protein}
              onChange={(e) => updateField('protein', e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs">Carbohidratos (g)</Label>
            <Input
              id="carbs"
              type="number"
              step="0.1"
              placeholder="50"
              value={fields.carbs}
              onChange={(e) => updateField('carbs', e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fats">Grasas (g)</Label>
            <Input
              id="fats"
              type="number"
              step="0.1"
              placeholder="15"
              value={fields.fats}
              onChange={(e) => updateField('fats', e.target.value)}
              className="h-12"
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full h-12" disabled={isSaving || !isValid}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Guardar comida
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

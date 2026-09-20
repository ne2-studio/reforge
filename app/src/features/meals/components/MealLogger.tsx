import { useState } from 'react';
import { Button } from '@/design-system/components/ui/button';
import { Textarea } from '@/design-system/components/ui/textarea';
import { Label } from '@/design-system/components/ui/label';
import { Input } from '@/design-system/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/design-system/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/design-system/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/design-system/components/ui/tabs';
import { Utensils, Clock, Check, Loader2, BookMarked, BookOpen, Sparkles } from 'lucide-react';
import type { AnalyzeMealData, MealLibraryItem, SaveMealData, SaveMealLibraryItemData } from '@/types';

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
  // Slice 3 (meal library) wiring — both optional so this component still works standalone
  // (e.g. in isolation in a story/test) without a library in scope yet.
  libraryItems?: MealLibraryItem[];
  onSaveToLibrary?: (data: SaveMealLibraryItemData) => void;
  // Slice 8 (AI coach) wiring — both optional, same reasoning as the library props above: this
  // component still works standalone without the AI-analysis mode wired up. When provided, a
  // "Analizar con IA" tab appears alongside the existing manual-entry form.
  isAnalyzing?: boolean;
  onAnalyze?: (data: AnalyzeMealData) => void;
}

function emptyLibraryFields(): { title: string; description: string; calories: string; protein: string; carbs: string; fats: string } {
  return { title: '', description: '', calories: '', protein: '', carbs: '', fats: '' };
}

interface AiFields {
  mealText: string;
  category: string;
  time: string;
}

function emptyAiFields(): AiFields {
  return { mealText: '', category: getDefaultCategory(), time: getDefaultTime() };
}

// Presentational — no react-router-dom/store/useCases imports. Ported from
// reforge-frontend/src/components/MealLogger.tsx, with two modes as a `Tabs` toggle instead of
// the source's three (`"manual"`/`"library"`/`"new"`):
// - "Manual": the original manual macro-entry form. The source's `"library"` tab is folded
//   into it instead of being a separate mode: a "cargar de biblioteca" picker pre-fills these
//   same fields, and a "guardar en biblioteca" dialog reads them back out — both stay
//   presentational, calling `onSaveToLibrary` for the actual mutation, which MealsRoute wires
//   to the mealLibrary useCase/toast, matching the existing onSave/handleSave split between
//   this component and its Route.
// - "Analizar con IA" (Slice 8): ports the source's `"new"` mode — free-text meal description,
//   category, time, no macro inputs, since `POST /analyze-meal` derives them. Calls `onAnalyze`,
//   which MealsRoute wires to the meals useCase's `analyzeAndLogMeal`. The AI-usage-limit props
//   that accompanied the source's `"new"` mode are dropped entirely (Stripe/Slice 9, deferred).
export function MealLogger({
  isSaving,
  onSave,
  libraryItems = [],
  onSaveToLibrary,
  isAnalyzing = false,
  onAnalyze,
}: MealLoggerProps) {
  const [fields, setFields] = useState<ManualFields>(emptyFields);
  const [isLibraryDialogOpen, setIsLibraryDialogOpen] = useState(false);
  const [libraryFields, setLibraryFields] = useState(emptyLibraryFields);
  const [aiFields, setAiFields] = useState<AiFields>(emptyAiFields);

  const updateAiField = (field: keyof AiFields, value: string) => {
    setAiFields({ ...aiFields, [field]: value });
  };

  const isAiValid = aiFields.mealText.trim() !== '';

  const handleAnalyze = () => {
    if (!isAiValid || !onAnalyze) return;
    onAnalyze({ mealText: aiFields.mealText, category: aiFields.category, time: aiFields.time });
    setAiFields(emptyAiFields());
  };

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

  // Pre-fills the manual form from a saved library item — mirrors reforge-frontend's
  // `selectLibraryMeal`. Doesn't touch `time`, since a library item has no time of its own.
  const handleLoadFromLibrary = (id: string) => {
    const item = libraryItems.find((libraryItem) => libraryItem.id === id);
    if (!item) return;
    setFields({
      ...fields,
      mealText: item.description,
      category: item.category,
      calories: String(item.calories),
      protein: String(item.protein),
      carbs: String(item.carbs),
      fats: String(item.fats),
    });
  };

  const openLibraryDialog = () => {
    setLibraryFields({
      title: '',
      description: fields.mealText,
      calories: fields.calories,
      protein: fields.protein,
      carbs: fields.carbs,
      fats: fields.fats,
    });
    setIsLibraryDialogOpen(true);
  };

  const isLibraryFormValid =
    libraryFields.title.trim() !== '' &&
    libraryFields.calories !== '' &&
    libraryFields.protein !== '' &&
    libraryFields.carbs !== '' &&
    libraryFields.fats !== '';

  const handleSaveToLibrary = () => {
    if (!isLibraryFormValid || !onSaveToLibrary) return;
    onSaveToLibrary({
      title: libraryFields.title,
      description: libraryFields.description,
      category: fields.category,
      calories: parseFloat(libraryFields.calories),
      protein: parseFloat(libraryFields.protein),
      carbs: parseFloat(libraryFields.carbs),
      fats: parseFloat(libraryFields.fats),
    });
    setIsLibraryDialogOpen(false);
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          Registrar comida
        </CardTitle>
        <CardDescription>Registra tu comida manualmente o analízala con IA</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="manual">
          <TabsList>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="ai">Analizar con IA</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            {libraryItems.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="loadFromLibrary">Cargar de biblioteca</Label>
                <Select onValueChange={handleLoadFromLibrary}>
                  <SelectTrigger id="loadFromLibrary" className="h-12">
                    <SelectValue placeholder="Selecciona una comida guardada" />
                  </SelectTrigger>
                  <SelectContent>
                    {libraryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1 h-12" disabled={isSaving || !isValid}>
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
              {onSaveToLibrary && (
                <Button type="button" variant="outline" className="h-12" onClick={openLibraryDialog}>
                  <BookMarked className="mr-2 h-5 w-5" />
                  Guardar en biblioteca
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aiCategory">Tipo</Label>
                <Select value={aiFields.category} onValueChange={(v) => updateAiField('category', v)}>
                  <SelectTrigger id="aiCategory" className="h-12">
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
                <Label htmlFor="aiTime">Hora</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <input
                    id="aiTime"
                    type="time"
                    value={aiFields.time}
                    onChange={(e) => updateAiField('time', e.target.value)}
                    className="w-full h-12 pl-11 pr-3 border-2 border-input rounded-lg bg-input text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiMealText">Descripción</Label>
              <Textarea
                id="aiMealText"
                placeholder='Ej: "2 huevos revueltos con aguacate y 2 tostadas"'
                value={aiFields.mealText}
                onChange={(e) => updateAiField('mealText', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <Button onClick={handleAnalyze} className="w-full h-12" disabled={isAnalyzing || !isAiValid}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Analizar y guardar
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={isLibraryDialogOpen} onOpenChange={setIsLibraryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Guardar en biblioteca
            </DialogTitle>
            <DialogDescription>Guarda esta comida como plantilla reutilizable.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="libraryTitle">Título</Label>
              <Input
                id="libraryTitle"
                placeholder="Ej: Pollo con arroz"
                value={libraryFields.title}
                onChange={(e) => setLibraryFields({ ...libraryFields, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="libraryDescription">Descripción</Label>
              <Textarea
                id="libraryDescription"
                value={libraryFields.description}
                onChange={(e) => setLibraryFields({ ...libraryFields, description: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="libraryCalories">Calorías (kcal)</Label>
                <Input
                  id="libraryCalories"
                  type="number"
                  value={libraryFields.calories}
                  onChange={(e) => setLibraryFields({ ...libraryFields, calories: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="libraryProtein">Proteína (g)</Label>
                <Input
                  id="libraryProtein"
                  type="number"
                  value={libraryFields.protein}
                  onChange={(e) => setLibraryFields({ ...libraryFields, protein: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="libraryCarbs">Carbohidratos (g)</Label>
                <Input
                  id="libraryCarbs"
                  type="number"
                  value={libraryFields.carbs}
                  onChange={(e) => setLibraryFields({ ...libraryFields, carbs: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="libraryFats">Grasas (g)</Label>
                <Input
                  id="libraryFats"
                  type="number"
                  value={libraryFields.fats}
                  onChange={(e) => setLibraryFields({ ...libraryFields, fats: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSaveToLibrary} disabled={!isLibraryFormValid}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

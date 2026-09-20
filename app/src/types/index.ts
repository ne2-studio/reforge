// Domain entity classes, hydrated from api.ts responses via `new Entity(data)` — see
// docs/architecture/frontend.md. Later slices add Meal, Workout, etc. here.
export class PingResult {
  readonly userId: string;
  readonly timestamp: Date;

  // Field names mirror the backend's PingResponseDto wire shape (`sub`/`serverTimeUtc` —
  // see api/Reforge.Core/Ping/IPingUseCase.cs), not this class's own property names: there's
  // no generated client between api/ and app/ (docs/API-CONVENTIONS.md#contract-changes), so
  // this mapping is the one place that has to be kept in sync by hand.
  constructor(data: { sub: string; serverTimeUtc: string }) {
    this.userId = data.sub;
    this.timestamp = new Date(data.serverTimeUtc);
  }
}

// Wire shape of api/Reforge.Core/Profiles/IProfileUseCase.cs's ProfileDto — field names
// already match this class's own property names (System.Text.Json's default camelCase
// serialization), verified against api/openapi/v1.swagger.json's ProfileDto schema. Kept as
// its own type rather than reusing the DTO shape directly per
// docs/API-CONVENTIONS.md#contract-changes (no generated client, hand-kept in sync).
export interface ProfileDtoShape {
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  activityLevel: string | null;
  goal: string | null;
  trainingDays: string[] | null;
  trainingType: string | null;
  trainingTime: string | null;
  restrictions: string | null;
  calorieTarget: number | null;
  extraData: Record<string, unknown> | null;
  updatedAt: string;
}

export class UserProfile {
  readonly age: number | null;
  readonly gender: string | null;
  readonly height: number | null;
  readonly weight: number | null;
  readonly activityLevel: string | null;
  readonly goal: string | null;
  readonly trainingDays: string[];
  readonly trainingType: string | null;
  readonly trainingTime: string | null;
  readonly restrictions: string | null;
  readonly calorieTarget: number | null;
  readonly extraData: Record<string, unknown>;
  readonly updatedAt: Date;

  constructor(data: ProfileDtoShape) {
    this.age = data.age;
    this.gender = data.gender;
    this.height = data.height;
    this.weight = data.weight;
    this.activityLevel = data.activityLevel;
    this.goal = data.goal;
    this.trainingDays = data.trainingDays ?? [];
    this.trainingType = data.trainingType;
    this.trainingTime = data.trainingTime;
    this.restrictions = data.restrictions;
    this.calorieTarget = data.calorieTarget;
    this.extraData = data.extraData ?? {};
    this.updatedAt = new Date(data.updatedAt);
  }
}

// Fields the user can submit via POST /profile (a full replace, not a patch) — mirrors
// SaveProfileRequestDto, i.e. ProfileDtoShape minus the server-owned `updatedAt`.
export type SaveProfileData = Omit<ProfileDtoShape, 'updatedAt'>;

// Wire shape of api/Reforge.Core/Meals/IMealsUseCase.cs's MealDto — field names already match
// this class's own property names, verified against api/openapi/v1.swagger.json's MealDto
// schema. Slice 2 is manual entry only, so every meal is user-typed (see SaveMealDtoShape's
// comment) — there's no `manualAnalysis` wrapper like the source `reforge-frontend`.
export interface MealDtoShape {
  id: string;
  mealText: string;
  category: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  feedback: string | null;
  extraData: Record<string, unknown> | null;
  timestamp: string;
  date: string;
}

export class Meal {
  readonly id: string;
  readonly mealText: string;
  readonly category: string;
  readonly time: string;
  readonly calories: number;
  readonly protein: number;
  readonly carbs: number;
  readonly fats: number;
  readonly feedback: string | null;
  readonly extraData: Record<string, unknown>;
  readonly timestamp: Date;
  readonly date: string;

  constructor(data: MealDtoShape) {
    this.id = data.id;
    this.mealText = data.mealText;
    this.category = data.category;
    this.time = data.time;
    this.calories = data.calories;
    this.protein = data.protein;
    this.carbs = data.carbs;
    this.fats = data.fats;
    this.feedback = data.feedback;
    this.extraData = data.extraData ?? {};
    this.timestamp = new Date(data.timestamp);
    this.date = data.date;
  }
}

// Fields the user can submit via POST /meals — mirrors SaveMealRequestDto, i.e. MealDtoShape
// minus the server-owned `id`/`timestamp`/`date`.
export type SaveMealData = Omit<MealDtoShape, 'id' | 'timestamp' | 'date'>;

// Wire shape of api/Reforge.Core/MealLibrary/IMealLibraryUseCase.cs's MealLibraryItemDto —
// field names already match this class's own property names. Category values are the same
// lowercase strings as Meal.category (see MealsRoute's CATEGORY_LABELS), not the source
// reforge-frontend's capitalized Spanish strings, for consistency within this codebase.
export interface MealLibraryItemDtoShape {
  id: string;
  title: string;
  description: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export class MealLibraryItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly calories: number;
  readonly protein: number;
  readonly carbs: number;
  readonly fats: number;

  constructor(data: MealLibraryItemDtoShape) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.category = data.category;
    this.calories = data.calories;
    this.protein = data.protein;
    this.carbs = data.carbs;
    this.fats = data.fats;
  }
}

// Fields the user can submit via POST /api/meal-library — mirrors
// SaveMealLibraryItemRequestDto, i.e. MealLibraryItemDtoShape minus the server-owned `id`;
// saving to the library is always a create, there's no edit use case in scope (see
// IMealLibraryUseCase.cs).
export type SaveMealLibraryItemData = Omit<MealLibraryItemDtoShape, 'id'>;

// Wire shape of MacroValuesDto — shared by DailyStatsDtoShape's `consumed`/`targets`.
export interface MacroValuesShape {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export class MacroValues {
  readonly calories: number;
  readonly protein: number;
  readonly carbs: number;
  readonly fats: number;

  constructor(data: MacroValuesShape) {
    this.calories = data.calories;
    this.protein = data.protein;
    this.carbs = data.carbs;
    this.fats = data.fats;
  }
}

// Wire shape of api/Reforge.Core/Activities/IActivitiesUseCase.cs's ActivityDto — field names
// already match this class's own property names (System.Text.Json's default camelCase
// serialization). `duration` is only set for `strength`/`cardio`, `steps` only for `neat` — the
// backend never sends both. Timestamp is always server-set (see IActivitiesUseCase.cs), never
// sent by the client.
export interface ActivityDtoShape {
  id: string;
  type: string;
  duration: number | null;
  steps: number | null;
  timestamp: string;
}

export class Activity {
  readonly id: string;
  readonly type: string;
  readonly duration: number | null;
  readonly steps: number | null;
  readonly timestamp: Date;

  constructor(data: ActivityDtoShape) {
    this.id = data.id;
    this.type = data.type;
    this.duration = data.duration;
    this.steps = data.steps;
    this.timestamp = new Date(data.timestamp);
  }
}

// Fields the user can submit via POST /api/activities — mirrors LogActivityRequestDto, i.e.
// ActivityDtoShape minus the server-owned `id`/`timestamp`.
export type LogActivityData = Omit<ActivityDtoShape, 'id' | 'timestamp'>;

// Wire shape of api/Reforge.Core/Workouts/IWorkoutsUseCase.cs's WorkoutDto — field names
// already match this class's own property names. `volume` (kg) is only set for `strength`,
// `duration` (minutes) only for `cardio` — the backend never sends both. Timestamp is always
// server-set, never sent by the client.
export interface WorkoutDtoShape {
  id: string;
  type: string;
  volume: number | null;
  duration: number | null;
  timestamp: string;
}

export class Workout {
  readonly id: string;
  readonly type: string;
  readonly volume: number | null;
  readonly duration: number | null;
  readonly timestamp: Date;

  constructor(data: WorkoutDtoShape) {
    this.id = data.id;
    this.type = data.type;
    this.volume = data.volume;
    this.duration = data.duration;
    this.timestamp = new Date(data.timestamp);
  }
}

// Fields the user can submit via POST /api/workouts — mirrors LogWorkoutRequestDto, i.e.
// WorkoutDtoShape minus the server-owned `id`/`timestamp`.
export type LogWorkoutData = Omit<WorkoutDtoShape, 'id' | 'timestamp'>;

// Wire shape of api/Reforge.Core/Measurements/IMeasurementsUseCase.cs's MeasurementDto — field
// names already match this class's own property names. `weight`/`waist`/`neck` are each
// independently optional (a measurement can log just one of them); the backend rejects a
// request where all three are null. Timestamp is always server-set, never sent by the client.
export interface MeasurementDtoShape {
  id: string;
  weight: number | null;
  waist: number | null;
  neck: number | null;
  timestamp: string;
}

export class Measurement {
  readonly id: string;
  readonly weight: number | null;
  readonly waist: number | null;
  readonly neck: number | null;
  readonly timestamp: Date;

  constructor(data: MeasurementDtoShape) {
    this.id = data.id;
    this.weight = data.weight;
    this.waist = data.waist;
    this.neck = data.neck;
    this.timestamp = new Date(data.timestamp);
  }
}

// Fields the user can submit via POST /api/measurements — mirrors LogMeasurementRequestDto,
// i.e. MeasurementDtoShape minus the server-owned `id`/`timestamp`.
export type LogMeasurementData = Omit<MeasurementDtoShape, 'id' | 'timestamp'>;

// Wire shape of GET /daily-stats/{date}'s DailyStatsDto.
export interface DailyStatsDtoShape {
  consumed: MacroValuesShape;
  targets: MacroValuesShape;
}

export class DailyStats {
  readonly consumed: MacroValues;
  readonly targets: MacroValues;

  constructor(data: DailyStatsDtoShape) {
    this.consumed = new MacroValues(data.consumed);
    this.targets = new MacroValues(data.targets);
  }
}

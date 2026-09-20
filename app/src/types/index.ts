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

// Wire shape of api/Reforge.Core/Reminders/IRemindersUseCase.cs's ReminderSettingsDto — field
// names already match this class's own property names. 1:1 per user, same "GET 404 before the
// first save" shape as ProfileDtoShape/UserProfile.
export interface ReminderSettingsDtoShape {
  enabled: boolean;
  channel: string;
  defaultTime: string;
  updatedAt: string;
}

export class ReminderSettings {
  readonly enabled: boolean;
  readonly channel: string;
  readonly defaultTime: string;
  readonly updatedAt: Date;

  constructor(data: ReminderSettingsDtoShape) {
    this.enabled = data.enabled;
    this.channel = data.channel;
    this.defaultTime = data.defaultTime;
    this.updatedAt = new Date(data.updatedAt);
  }
}

// Fields the user can submit via PUT /api/reminder-settings — mirrors
// UpdateReminderSettingsRequestDto, i.e. ReminderSettingsDtoShape minus the server-owned
// `updatedAt`.
export type SaveReminderSettingsData = Omit<ReminderSettingsDtoShape, 'updatedAt'>;

// Wire shape of api/Reforge.Core/Reminders/IRemindersUseCase.cs's CustomReminderDto — field
// names already match this class's own property names. A user can have many of these, each
// with its own label/time/days-of-week, in addition to ReminderSettings' global defaults.
export interface CustomReminderDtoShape {
  id: string;
  label: string;
  time: string;
  daysOfWeek: string[];
  enabled: boolean;
  updatedAt: string;
}

export class CustomReminder {
  readonly id: string;
  readonly label: string;
  readonly time: string;
  readonly daysOfWeek: string[];
  readonly enabled: boolean;
  readonly updatedAt: Date;

  constructor(data: CustomReminderDtoShape) {
    this.id = data.id;
    this.label = data.label;
    this.time = data.time;
    this.daysOfWeek = data.daysOfWeek;
    this.enabled = data.enabled;
    this.updatedAt = new Date(data.updatedAt);
  }
}

// Fields the user can submit via POST /api/custom-reminders or PUT
// /api/custom-reminders/{id} — mirrors SaveCustomReminderRequestDto, i.e.
// CustomReminderDtoShape minus the server-owned `id`/`updatedAt`.
export type SaveCustomReminderData = Omit<CustomReminderDtoShape, 'id' | 'updatedAt'>;

// Fields the user can submit via POST /api/analyze-meal — mirrors AnalyzeMealRequestDto: no
// macro inputs, unlike SaveMealData, since the AI backend derives them (see
// api/Reforge.Core/Meals/IMealsUseCase.cs's AnalyzeAndSaveMealAsync).
export interface AnalyzeMealData {
  mealText: string;
  category: string;
  time: string;
}

// Wire shape of api/Reforge.Core/Chat/IChatUseCase.cs's ChatMessageDto — field names already
// match this class's own property names, verified against api/openapi/v1.swagger.json's
// ChatMessageDto schema. One instance covers a whole turn (user message + assistant reply),
// matching the backend's own persistence model — there's no separate "role" per message.
export interface ChatMessageDtoShape {
  id: string;
  userMessage: string;
  assistantMessage: string;
  timestamp: string;
}

export class ChatMessage {
  readonly id: string;
  readonly userMessage: string;
  readonly assistantMessage: string;
  readonly timestamp: Date;

  constructor(data: ChatMessageDtoShape) {
    this.id = data.id;
    this.userMessage = data.userMessage;
    this.assistantMessage = data.assistantMessage;
    this.timestamp = new Date(data.timestamp);
  }
}

// Wire shape of api/Reforge.Core/ClosedDays/IClosedDaysUseCase.cs's ClosedDayDto — field names
// already match this class's own property names. `date` is a DateOnly (`yyyy-MM-dd`), `closedAt`
// a full ISO 8601 timestamp — see that file's own doc-comment on why: date-close is a whole-day
// concept, closedAt is just the audit trail of when the button was pressed.
export interface ClosedDayDtoShape {
  date: string;
  closedAt: string;
  totalCalories: number;
  mealsCount: number;
  isTrainingDay: boolean;
  analysis: string;
}

export class ClosedDay {
  readonly date: string;
  readonly closedAt: Date;
  readonly totalCalories: number;
  readonly mealsCount: number;
  readonly isTrainingDay: boolean;
  readonly analysis: string;

  constructor(data: ClosedDayDtoShape) {
    this.date = data.date;
    this.closedAt = new Date(data.closedAt);
    this.totalCalories = data.totalCalories;
    this.mealsCount = data.mealsCount;
    this.isTrainingDay = data.isTrainingDay;
    this.analysis = data.analysis;
  }
}

// Wire shape of WeeklyDayDto — one day's row within WeeklyProgressDto's `days`. Kept as a plain
// interface, not a class, since it's a passive data row with no derived behavior of its own
// (same reasoning MacroValuesShape/DailyStatsDtoShape would use if MacroValues weren't already
// a class for other reasons) — WeeklyProgress is the one class that owns hydration for both.
export interface WeeklyDayDtoShape {
  date: string;
  targetCalories: number;
  consumedCalories: number;
  deficit: number;
  mealsCount: number;
  isClosed: boolean;
}

// Wire shape of WeeklyProgressDto.
export interface WeeklyProgressDtoShape {
  days: WeeklyDayDtoShape[];
  totalDeficit: number;
  daysInDeficit: number;
  daysInSurplus: number;
  daysWithMeals: number;
  adherenceStreak: number;
  insights: string[];
}

export class WeeklyProgress {
  readonly days: WeeklyDayDtoShape[];
  readonly totalDeficit: number;
  readonly daysInDeficit: number;
  readonly daysInSurplus: number;
  readonly daysWithMeals: number;
  readonly adherenceStreak: number;
  readonly insights: string[];

  constructor(data: WeeklyProgressDtoShape) {
    this.days = data.days;
    this.totalDeficit = data.totalDeficit;
    this.daysInDeficit = data.daysInDeficit;
    this.daysInSurplus = data.daysInSurplus;
    this.daysWithMeals = data.daysWithMeals;
    this.adherenceStreak = data.adherenceStreak;
    this.insights = data.insights;
  }
}

export type SubscriptionTier = 'Free' | 'Premium';
export type SubscriptionStatus = 'None' | 'Active' | 'Canceled';

// Wire shape of a single usage counter within SubscriptionDto's `usage` object — a passive
// data row with no derived behavior of its own, same reasoning as WeeklyDayDtoShape.
export interface UsageLimitDtoShape {
  count: number;
  limit: number;
}

// Wire shape of the Slice 9 backend's `GET /api/subscription` (see the ticket's fixed HTTP
// contract — api/'s Subscriptions feature is being built in parallel against this same
// shape). `limit` is always 10 regardless of tier per that backend's current design — this
// class doesn't try to hide that; callers must gate any usage-bar UI on `tier === 'Free'`
// themselves, same as the ticket's own instruction, rather than this class silently lying
// about a Premium row being "unlimited".
export interface SubscriptionDtoShape {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  usage: {
    mealAnalysis: UsageLimitDtoShape;
    chatMessages: UsageLimitDtoShape;
  };
}

export class Subscription {
  readonly tier: SubscriptionTier;
  readonly status: SubscriptionStatus;
  readonly currentPeriodEnd: Date | null;
  readonly mealAnalysisUsage: UsageLimitDtoShape;
  readonly chatMessagesUsage: UsageLimitDtoShape;

  constructor(data: SubscriptionDtoShape) {
    this.tier = data.tier;
    this.status = data.status;
    this.currentPeriodEnd = data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null;
    this.mealAnalysisUsage = data.usage.mealAnalysis;
    this.chatMessagesUsage = data.usage.chatMessages;
  }
}

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

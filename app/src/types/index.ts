// Domain entity classes, hydrated from api.ts responses via `new Entity(data)` — see
// docs/architecture/frontend.md. Only PingResult exists so far (walking skeleton); later
// slices add UserProfile, Meal, Workout, etc. here.
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

// Domain entity classes, hydrated from api.ts responses via `new Entity(data)` — see
// docs/architecture/frontend.md. Only PingResult exists so far (walking skeleton); later
// slices add UserProfile, Meal, Workout, etc. here.
export class PingResult {
  readonly userId: string;
  readonly timestamp: Date;

  constructor(data: { userId: string; timestamp: string }) {
    this.userId = data.userId;
    this.timestamp = new Date(data.timestamp);
  }
}

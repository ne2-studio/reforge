import { useUserStore } from "../store/useUserStore";

interface GoalBannerProps {
}

// US Navy Body Fat Formula
const calculateBodyFat = (
  gender: string,
  height: number,
  waist: number,
  neck: number
): number => {
  if (gender === 'male') {
    const logWaistMinusNeck = Math.log10(waist - neck);
    const logHeight = Math.log10(height);
    const denominator = 1.0324 - 0.19077 * logWaistMinusNeck + 0.15456 * logHeight;
    return 495 / denominator - 450;
  } else {
    const logWaistMinusNeck = Math.log10(waist - neck);
    const logHeight = Math.log10(height);
    return 163.205 * logWaistMinusNeck - 97.684 * logHeight - 78.387;
  }
};

const goalEmojis: Record<string, string> = {
  "lose-fat": "🔥",
  "gain-muscle": "💪",
  "recomp": "⚡",
  "maintain": "🎯",
};

const goalLabels: Record<string, string> = {
  "lose-fat": "Perder grasa",
  "gain-muscle": "Ganar músculo",
  "recomp": "Recomposición",
  "maintain": "Mantener",
};

export const GoalBanner = ({}: GoalBannerProps) => {
  const { profile, measurements } = useUserStore();

  if (!profile) return null;
  // Calculate current body fat from latest measurement
  let currentBodyFat: number | null = null;
  if (measurements.length > 0 && profile.height) {
    // Sort by timestamp to get the most recent measurement
    const sortedMeasurements = [...measurements].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latestMeasurement = sortedMeasurements[0];

    if (latestMeasurement.waist && latestMeasurement.neck) {
      currentBodyFat = calculateBodyFat(
        profile.gender,
        parseFloat(profile.height),
        latestMeasurement.waist,
        latestMeasurement.neck
      );
    }
  }

  return (
    <div className="bg-gradient-to-br from-primary/20 via-primary/15 to-accent/20 rounded-2xl p-4 border-2 border-primary/40 shadow-lg shadow-primary/20">
      <div>
        {/* Mobile: Vertical layout */}
        <div className="flex flex-col gap-4 md:hidden">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{goalEmojis[profile.goal]}</div>
            <div>
              <h2 className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                {goalLabels[profile.goal]}
              </h2>
              <p className="text-xs text-muted-foreground">
                Tu objetivo principal
              </p>
            </div>
          </div>
          
          {(currentBodyFat !== null || profile.goalBodyFat) && (
            <div className="bg-background/60 rounded-lg p-4 border border-primary/20">
              <div className="grid grid-cols-2 gap-4">
                {currentBodyFat !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Actual</p>
                    <p className="text-2xl text-primary leading-none mb-1">
                      {currentBodyFat.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">grasa corporal</p>
                  </div>
                )}
                {profile.goalBodyFat && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Meta</p>
                    <p className="text-2xl text-accent leading-none mb-1">
                      {profile.goalBodyFat}%
                    </p>
                    {currentBodyFat !== null && (
                      <p className="text-xs text-muted-foreground">
                        Faltan {Math.abs(currentBodyFat - parseFloat(profile.goalBodyFat)).toFixed(1)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Horizontal compact layout */}
        <div className="hidden md:flex items-center justify-between gap-3">
          {/* Left side: Goal */}
          <div className="flex items-center gap-3">
            <div className="text-3xl">{goalEmojis[profile.goal]}</div>
            <div>
              <h2 className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
                {goalLabels[profile.goal]}
              </h2>
              <p className="text-sm text-muted-foreground">
                Tu objetivo principal
              </p>
            </div>
          </div>

          {/* Right side: Stats */}
          {currentBodyFat !== null ? (
            <div className="flex items-center gap-4 bg-background/60 rounded-lg px-4 py-3 border border-primary/20 ml-auto">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Grasa actual</p>
                <p className="text-3xl text-primary leading-none">
                  {currentBodyFat.toFixed(1)}%
                </p>
              </div>
              {profile.goalBodyFat && (
                <>
                  <div className="h-12 w-px bg-border"></div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Meta de grasa</p>
                    <p className="text-3xl text-accent leading-none">
                      {profile.goalBodyFat}%
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : profile.goalBodyFat ? (
            <div className="bg-background/60 rounded-lg px-4 py-3 border border-primary/20 text-center ml-auto">
              <p className="text-xs text-muted-foreground mb-1">Meta de grasa</p>
              <p className="text-3xl text-accent leading-none">{profile.goalBodyFat}%</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

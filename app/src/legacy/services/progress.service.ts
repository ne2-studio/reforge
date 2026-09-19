import { Measurement } from "../types";

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export const progressService = {
  async getMeasurements(accessToken: string): Promise<{ measurements: Measurement[] }> {
    const response = await fetch(`${BASE_URL}/measurements`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load measurements: ${response.status}`);
    }

    return response.json();
  },

  async saveMeasurement(accessToken: string, measurement: Omit<Measurement, "id">): Promise<{ measurement: Measurement }> {
    const response = await fetch(`${BASE_URL}/measurement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(measurement),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to save measurement: ${response.status}`);
    }

    return response.json();
  }
};

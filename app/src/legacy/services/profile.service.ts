import { UserProfile } from "../types";

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

export const profileService = {
  async getProfile(accessToken: string): Promise<{ profile: UserProfile }> {
    const response = await fetch(`${BASE_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to load profile: ${response.status}`);
    }

    return response.json();
  },

  async updateProfile(accessToken: string, profileData: UserProfile): Promise<{ profile: UserProfile }> {
    const response = await fetch(`${BASE_URL}/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update profile: ${response.status}`);
    }

    return response.json();
  },

  async deleteAccount(accessToken: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/delete-account`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete account: ${response.status}`);
    }
  }
};

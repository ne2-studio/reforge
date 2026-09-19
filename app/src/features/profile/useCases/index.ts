import { api } from '@/api';
import { useProfileStore } from '@/store/profileStore';
import type { SaveProfileData } from '@/types';

// Orchestration layer for the profile feature — see docs/architecture/frontend.md's
// `useCases/` layer. Each function calls api.profile.*, then writes the result into
// profileStore; ProfileRoute reads the store's state and calls these for anything mutating.

export async function loadProfile(): Promise<void> {
  useProfileStore.setState({ isLoading: true, error: null });
  try {
    // null here means "no profile saved yet" (404), not a failure — see profileApi.getProfile.
    const profile = await api.profile.getProfile();
    useProfileStore.setState({ profile, isLoading: false });
  } catch (error) {
    useProfileStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo cargar el perfil',
      isLoading: false,
    });
  }
}

export async function submitProfile(data: SaveProfileData): Promise<void> {
  useProfileStore.setState({ isLoading: true, error: null });
  try {
    const profile = await api.profile.saveProfile(data);
    useProfileStore.setState({ profile, isLoading: false });
  } catch (error) {
    useProfileStore.setState({
      error: error instanceof Error ? error.message : 'No se pudo guardar el perfil',
      isLoading: false,
    });
    throw error;
  }
}

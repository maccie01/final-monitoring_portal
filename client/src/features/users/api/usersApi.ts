import { apiClient } from '@/lib/apiClient';

export const usersApi = {
  // User endpoints
  async getAllUsers() {
    return apiClient.get('/api/users');
  },

  async getUsersByMandant() {
    return apiClient.get('/api/users/mandant');
  },

  async createUser(userData: any) {
    return apiClient.post('/api/users', userData);
  },

  async updateUser(id: number, data: any) {
    return apiClient.patch(`/api/users/${id}`, data);
  },

  async deleteUser(id: number) {
    return apiClient.delete(`/api/users/${id}`);
  },

  async changePassword(id: number, passwordData: { currentPassword: string; newPassword: string }) {
    return apiClient.post(`/api/users/${id}/change-password`, passwordData);
  },

  // User Profiles endpoints
  async getUserProfiles() {
    return apiClient.get('/api/user-profiles');
  },

  async createUserProfile(data: any) {
    return apiClient.post('/api/user-profiles', data);
  },

  async updateUserProfile(id: number, data: any) {
    return apiClient.put(`/api/user-profiles/${id}`, data);
  },

  async deleteUserProfile(id: number) {
    return apiClient.delete(`/api/user-profiles/${id}`);
  },

  // Mandants endpoints
  async getMandants() {
    return apiClient.get('/api/mandants');
  },

  async createMandant(data: any) {
    return apiClient.post('/api/mandants', data);
  },

  async updateMandant(id: number, data: any) {
    return apiClient.patch(`/api/mandants/${id}`, data);
  },

  async deleteMandant(id: number) {
    return apiClient.delete(`/api/mandants/${id}`);
  },
};

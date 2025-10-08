import { apiClient } from '@/lib/apiClient';

export const objectsApi = {
  // Objects endpoints
  async getAllObjects(mandantId?: number) {
    const url = mandantId ? `/api/objects?mandantId=${mandantId}` : '/api/objects';
    return apiClient.get(url);
  },

  async getObjectById(objectId: number) {
    return apiClient.get(`/api/objects/${objectId}`);
  },

  async createObject(data: any) {
    return apiClient.post('/api/objects', data);
  },

  async updateObject(objectId: number, data: any) {
    return apiClient.patch(`/api/objects/${objectId}`, data);
  },

  async updateObjectMeter(objectId: number, data: any) {
    return apiClient.patch(`/api/objects/${objectId}`, { meter: data });
  },

  async updateObjectData(objectId: number, data: any) {
    return apiClient.patch(`/api/objects/${objectId}`, { objdata: data });
  },

  async updateObjectInfo(objectId: number, data: any) {
    return apiClient.patch(`/api/objects/${objectId}`, data);
  },

  async deleteObject(objectId: number) {
    return apiClient.delete(`/api/objects/${objectId}`);
  },

  async updateObjectCoordinates(objectId: number, coordinates: { lat: number; lng: number }) {
    return apiClient.patch(`/api/objects/${objectId}/coordinates`, coordinates);
  },

  // Object Groups endpoints
  async getObjectGroups() {
    return apiClient.get('/api/object-groups');
  },

  async createObjectGroup(data: any) {
    return apiClient.post('/api/object-groups', data);
  },

  async updateObjectGroup(id: number, data: any) {
    return apiClient.patch(`/api/object-groups/${id}`, data);
  },

  async deleteObjectGroup(id: number) {
    return apiClient.delete(`/api/object-groups/${id}`);
  },

  // Object-Mandant association
  async createObjectMandantAssociation(data: { objectId: number; mandantId: number; role: string }) {
    return apiClient.post('/api/object-mandant', data);
  },

  async updateObjectMandantAssociation(objectId: number, data: any) {
    return apiClient.patch(`/api/object-mandant/${objectId}`, data);
  },

  async deleteObjectMandantAssociation(objectId: number, mandantId: number) {
    return apiClient.delete(`/api/object-mandant/${objectId}/${mandantId}`);
  },
};

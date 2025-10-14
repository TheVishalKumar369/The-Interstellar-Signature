import axios from 'axios';
import type {
  InterstellarObject,
  LivePositionResponse,
  QueryModeResponse,
  OrbitalResponse,
  MultiComparisonResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 seconds - JPL Horizons can be slow when fetching planet ephemeris
  headers: {
    'Content-Type': 'application/json'
  }
});

// API endpoints
export const apiClient = {
  // Get all interstellar objects
  async getObjects(): Promise<InterstellarObject[]> {
    const response = await api.get('/api/objects');
    return response.data;
  },

  // Get specific object info
  async getObject(name: string): Promise<InterstellarObject> {
    const response = await api.get(`/api/object?name=${encodeURIComponent(name)}`);
    return response.data;
  },

  // Get live position (real-time)
  async getLivePosition(objectId: string, observer: string = '@399'): Promise<LivePositionResponse> {
    const response = await api.get(`/api/live/${encodeURIComponent(objectId)}`, {
      params: { observer }
    });
    return response.data;
  },

  // Get query mode data (custom time range)
  async getQueryMode(
    objectId: string,
    startTime: string,
    stopTime: string,
    stepSize: string = '1d',
    observer: string = '@399',
    includePlanets: boolean = false
  ): Promise<QueryModeResponse> {
    const response = await api.post(
      `/api/query/${encodeURIComponent(objectId)}`,
      null,
      {
        params: {
          start_time: startTime,
          stop_time: stopTime,
          step_size: stepSize,
          observer,
          include_planets: includePlanets
        },
        timeout: includePlanets ? 300000 : 90000 // 5 minutes if fetching planets, otherwise 90 seconds
      }
    );
    return response.data;
  },

  // Get orbital elements
  async getOrbitalElements(objectId: string): Promise<OrbitalResponse> {
    const response = await api.get(`/api/orbital/${encodeURIComponent(objectId)}`);
    return response.data;
  },

  // Compare multiple objects
  async compareObjects(
    objectIds: string[],
    startTime: string,
    stopTime: string,
    stepSize: string = '1d'
  ): Promise<MultiComparisonResponse> {
    // Build query string manually for array parameters
    const params = new URLSearchParams();
    objectIds.forEach(id => params.append('object_ids', id));
    params.append('start_time', startTime);
    params.append('stop_time', stopTime);
    params.append('step_size', stepSize);

    const response = await api.post(`/api/compare-multi?${params.toString()}`);
    return response.data;
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/api/health');
    return response.data;
  }
};

export default api;

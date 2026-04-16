import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Paper-related API calls
export const searchPapers = async (query) => {
  try {
    const response = await apiClient.get('/papers', {
      params: { query },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching papers:', error);
    throw error;
  }
};

export const getPaperById = async (id) => {
  try {
    const response = await apiClient.get(`/papers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching paper:', error);
    throw error;
  }
};

export const getPaperRelationships = async (id) => {
  try {
    const response = await apiClient.get(`/papers/${id}/relationships`);
    return response.data;
  } catch (error) {
    console.error('Error fetching relationships:', error);
    throw error;
  }
};

export const getGraphData = async (paperId, depth = 2) => {
  try {
    const response = await apiClient.get(`/papers/${paperId}/graph`, {
      params: { depth },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching graph data:', error);
    throw error;
  }
};

export default apiClient;

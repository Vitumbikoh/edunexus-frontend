

export const api = {
  get: async (endpoint: string) => {
    try {
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5000/api/v1' 
        : '/api';
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API request failed with status ${response.status}: ${errorData.message || response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  put: async (endpoint: string, body: unknown) => {
    try {
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5000/api/v1' 
        : '/api';
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API request failed with status ${response.status}: ${errorData.message || response.statusText}`
        );
      }
      return await response.json().catch(() => ({}));
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
};

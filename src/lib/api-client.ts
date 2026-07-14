export const apiClient = {
  get: async (endpoint: string) => {
    // In a real app, you would add auth headers here
    const res = await fetch(`/api${endpoint}`);
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  },
  post: async (endpoint: string, data: any) => {
    const res = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('API Request Failed');
    return res.json();
  }
};

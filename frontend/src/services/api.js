const BASE_URL = 'http://localhost:5001/api';

export const api = {
    get: async (endpoint) => {
        try {
            console.log(`Making GET request to: ${BASE_URL}${endpoint}`);
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const text = await response.text();
                console.error(`API Error (${response.status}):`, text);
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.error || 'API request failed');
                } catch (e) {
                    console.error('Response was not JSON:', text);
                    throw new Error('Invalid server response');
                }
            }
            
            const data = await response.json();
            console.log(`Response from ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    },

    post: async (endpoint, data) => {
        try {
            console.log(`Making POST request to: ${BASE_URL}${endpoint}`, data);
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`API Error (${response.status}):`, text);
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.error || 'API request failed');
                } catch (e) {
                    console.error('Response was not JSON:', text);
                    throw new Error('Invalid server response');
                }
            }

            const responseData = await response.json();
            console.log(`Response from ${endpoint}:`, responseData);
            return responseData;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    },

    delete: async (endpoint) => {
        try {
            console.log(`Making DELETE request to: ${BASE_URL}${endpoint}`);
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            // Log full response for debugging
            console.log('Delete Response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            // Handle different response scenarios
            if (!response.ok) {
                const text = await response.text();
                console.error(`API Error (${response.status}):`, text);
                
                try {
                    // Try parsing as JSON first
                    const json = JSON.parse(text);
                    throw new Error(json.error || 'Delete request failed');
                } catch (jsonError) {
                    // If not JSON, throw original text
                    throw new Error(text || 'Invalid server response');
                }
            }
            
            // Try parsing response as JSON, fallback to empty object
            const data = await response.json().catch(() => ({}));
            console.log(`Response from ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    },
};

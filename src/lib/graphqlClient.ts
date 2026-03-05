export const graphqlRequest = async (query: string, variables = {}) => {
    const token = localStorage.getItem('auth_token');
    // Use environment variable for API URL or default to localhost
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql';
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();
    if (result.errors) {
        throw new Error(result.errors[0].message);
    }
    return result.data;
};

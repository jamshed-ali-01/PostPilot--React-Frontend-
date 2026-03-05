export const graphqlRequest = async (query: string, variables = {}) => {
    const token = localStorage.getItem('auth_token');
    // Ensure we are pointing to the correct backend port (3000)
    const response = await fetch('http://localhost:3000/graphql', {
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

// config.js
const config = {
    clientId: 'your-client-id', // Replace with your client ID
    issuer: 'https://your-identity-provider.com', // Replace with your issuer URL (e.g., https://your-next-identity-provider.com)
    redirectUri: window.location.origin + '/callback', // Important: Add a callback route
    scopes: ['openid', 'profile', 'email'], // Add the scopes you need
};

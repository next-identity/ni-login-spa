// config.js
// const config = {
//     clientId: 'your-client-id', // Replace with your client ID
//     issuer: 'https://your-identity-provider.com', // Replace with your issuer URL (e.g., https://your-next-identity-provider.com)
//     redirectUri: window.location.origin + '/callback', // Important: Add a callback route
//     scopes: ['openid', 'profile', 'email'], // Add the scopes you need
// };
const config = {
    clientId: '9d91b1edf0af4d7ab46a07408295ec45', // Replace with your client ID
    issuer: 'https://ajyc6qopjq-dev.idp.nextidentity.io', // Replace with your issuer URL (e.g., https://your-next-identity-provider.com)
    redirectUri: window.location.origin + '/callback', // Important: Add a callback route
    scopes: ['profile', 'openid', 'email'], // Add the scopes you need
};


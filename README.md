# Getting Started with Next Identity Login

This guide walks you through quickly getting secure login with Next Identity working with a simple local HTML app. You will clone a pre-built project, configure your details, and run it locally with HTTPS.

***Pre-requisite:** you need a Next Identity client id and issuer URL by configuring a user journey in the admin console.*

## 1. Clone the Project

Clone the sample Next Identity Single Page Application (SPA) project:

```sh
git clone https://github.com/next-reason/ni-login-spa.git
cd ni-login-spa
```

## 2. Configure Your Identity Settings

Update the configuration file (`config.js`) in the project to match your OpenID Connect provider details:

```javascript
// config.js
const config = {
    clientId: 'your-client-id', // Replace with your client ID
    issuer: 'https://your-identity-provider.com', // Replace with your issuer URL 
    redirectUri: window.location.origin + '/callback', // Important: Add a callback route
    scopes: ['openid', 'profile', 'email'], // Add the scopes you need
};
```

## 3. Update your redirect URI list to include localhost (in console)

Update the client configuration within the next identity dashboard to include a redirect uri for localhost callback url:

https://localhost:3000/callback

Without this step you will get an invalid redirect parameter error when you try to click login once the project is running.

## 4. Modify the OpenID Connect SDK (Optional)

By default, the project uses the OpenID Connect SDK from the CDN:

```html
<script src="https://cdn.jsdelivr.net/gh/next-reason/ni-js-sdk@latest/next-identity-client.js"></script>
```

If you need to customize the SDK, clone the repository and use your local version:

```sh
git clone https://github.com/next-reason/ni-js-sdk.git
```

Follow the README instructions in that repository to build and link it into your project.

## 5. Enable HTTPS Locally with mkcert

Next Identity requires HTTPS as a callback URL. To use HTTPS on localhost, install `mkcert`:

### Install mkcert

#### macOS:

```sh
brew install mkcert
brew install nss # For Firefox support
```

#### Windows (with Chocolatey):

```sh
choco install mkcert
```

#### Linux:

Follow installation steps at [mkcert GitHub](https://github.com/FiloSottile/mkcert).

### Generate Local Certificates

Run the following inside the project directory:

```sh
mkcert -install
mkcert localhost
```

This creates `localhost.pem` and `localhost-key.pem`.

If you are using a more advanced dev server like Webpack Dev Server, you'll need to configure it to use the certificates. Here is an example webpack.config.js configuration:

```javascript
module.exports = \{\
    // ... other config\
    devServer: \{
    https: \{
      key: './localhost-key.pem',
      cert: './localhost.pem',
    },
    port: 3000,
  },
};
```

## 6. Start Your Local Server

```sh
npx serve -s . -l 3000 --ssl-cert localhost.pem --ssl-key localhost-key.pem
```

Now your app will be accessible via `https://localhost:3000/`.

***

Your Next Identity login should now be fully functional and running securely over HTTPS!

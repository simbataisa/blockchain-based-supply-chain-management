import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';

interface Auth0ProviderWrapperProps {
  children: React.ReactNode;
}

const Auth0ProviderWrapper: React.FC<Auth0ProviderWrapperProps> = ({ children }) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
  const isDevelopment = import.meta.env.DEV;

  // In development mode, if Auth0 is not configured, show a warning but allow the app to continue
  if (!domain || !clientId || domain.includes('dev-example') || clientId.includes('your-auth0')) {
    if (isDevelopment) {
      console.warn('Auth0 not configured for development. Using mock authentication.');
      // Return children directly to bypass Auth0 in development
      return <>{children}</>;
    } else {
      console.error('Auth0 configuration missing. Please check your environment variables.');
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Auth0 Configuration Error</h2>
            <p className="text-gray-600">
              Please configure your Auth0 environment variables in .env file.
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: "openid profile email"
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWrapper;
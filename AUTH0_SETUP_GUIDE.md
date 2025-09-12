# Auth0 Configuration Guide

This guide explains how to set up Auth0 authentication for the blockchain simulation application and configure the necessary environment variables.

## Prerequisites

- Auth0 account (sign up at [auth0.com](https://auth0.com))
- Access to Auth0 Dashboard
- Basic understanding of JWT tokens and OAuth 2.0

## Step 1: Create Auth0 Application

### 1.1 Create a Single Page Application (SPA)

1. Log in to your Auth0 Dashboard
2. Navigate to **Applications** > **Applications**
3. Click **Create Application**
4. Choose **Single Page Web Applications**
5. Select **React** as the technology
6. Click **Create**

### 1.2 Configure Application Settings

In your application settings, configure:

- **Allowed Callback URLs**: `http://localhost:5173/callback, http://localhost:3000/callback`
- **Allowed Logout URLs**: `http://localhost:5173, http://localhost:3000`
- **Allowed Web Origins**: `http://localhost:5173, http://localhost:3000`
- **Allowed Origins (CORS)**: `http://localhost:5173, http://localhost:3000`

### 1.3 Note Down Application Details

Save these values from the **Settings** tab:
- **Domain** (e.g., `dev-example.us.auth0.com`)
- **Client ID**
- **Client Secret** (if available)

## Step 2: Create Auth0 API

### 2.1 Create API Resource

1. Navigate to **Applications** > **APIs**
2. Click **Create API**
3. Provide:
   - **Name**: `Blockchain Simulation API`
   - **Identifier**: `https://your-api.example.com` (this becomes your audience)
   - **Signing Algorithm**: `RS256`
4. Click **Create**

### 2.2 Configure API Settings

- Enable **Allow Offline Access** if you need refresh tokens
- Configure **Token Expiration** as needed (default: 24 hours)

## Step 3: Create Machine-to-Machine Application (Optional)

*Only needed if you set `USE_AUTH0_MANAGEMENT=true` for production mode*

1. Navigate to **Applications** > **Applications**
2. Click **Create Application**
3. Choose **Machine to Machine Applications**
4. Select your **Auth0 Management API**
5. Grant necessary scopes:
   - `read:users`
   - `create:users`
   - `update:users`
   - `delete:users`

## Step 4: Configure Environment Variables

### 4.1 Feature Flag Configuration

The application supports two modes of operation:

- **Demo Mode** (`USE_AUTH0_MANAGEMENT=false`): Simulates Auth0 responses without requiring full Auth0 setup
- **Production Mode** (`USE_AUTH0_MANAGEMENT=true`): Uses actual Auth0 Management API

### 4.2 Frontend Configuration (VITE_ prefix)

Add these variables to your `.env` file for frontend use:

```env
# =============================================================================
# AUTH0 CONFIGURATION
# =============================================================================
# Feature flag to control Auth0 Management API usage
# Set to 'false' for demo mode, 'true' for production
USE_AUTH0_MANAGEMENT=false

# Frontend Auth0 configuration (VITE_ prefix for frontend)
VITE_AUTH0_DOMAIN=your-auth0-domain.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-frontend-client-id
VITE_AUTH0_AUDIENCE=https://your-api.example.com
VITE_AUTH0_REDIRECT_URI=http://localhost:5173/callback
```

### 4.3 Backend Configuration (No VITE_ prefix)

Add these variables for backend API use:

```env
# Backend Auth0 configuration (no VITE_ prefix for backend)
AUTH0_DOMAIN=your-auth0-domain.us.auth0.com
AUTH0_CLIENT_ID=your-backend-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://your-api.example.com
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.us.auth0.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

### 4.4 Complete .env Example

```env
# =============================================================================
# AUTH0 CONFIGURATION
# =============================================================================
# Feature flag to control Auth0 Management API usage
# Set to 'false' for demo mode, 'true' for production
USE_AUTH0_MANAGEMENT=false

# Frontend Auth0 configuration (VITE_ prefix for frontend)
VITE_AUTH0_DOMAIN=dev-blockchain-sim.us.auth0.com
VITE_AUTH0_CLIENT_ID=abc123def456ghi789jkl012
VITE_AUTH0_AUDIENCE=https://blockchain-api.example.com
VITE_AUTH0_REDIRECT_URI=http://localhost:5173/callback

# Backend Auth0 configuration (no VITE_ prefix for backend)
AUTH0_DOMAIN=dev-blockchain-sim.us.auth0.com
AUTH0_CLIENT_ID=xyz789uvw456rst123opq012
AUTH0_CLIENT_SECRET=your-machine-to-machine-secret-here
AUTH0_AUDIENCE=https://blockchain-api.example.com
AUTH0_ISSUER_BASE_URL=https://dev-blockchain-sim.us.auth0.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

### 4.5 Feature Flag Explanation

- **`USE_AUTH0_MANAGEMENT=false`** (Demo Mode): 
  - User registration and profile endpoints simulate Auth0 responses
  - No actual Auth0 Management API calls are made
  - Perfect for development and testing without full Auth0 setup
  - Machine-to-Machine credentials are not required

- **`USE_AUTH0_MANAGEMENT=true`** (Production Mode):
  - Uses actual Auth0 Management API for user operations
  - Requires properly configured Machine-to-Machine application
  - All Auth0 credentials must be valid and properly set up

## Step 5: Configure User Roles and Metadata

### 5.1 Create Custom Claims

1. Navigate to **Auth Pipeline** > **Rules** (or **Actions** > **Flows**)
2. Create a rule/action to add custom claims to tokens:

```javascript
function addCustomClaims(user, context, callback) {
  const namespace = 'https://blockchain-sim.com/';
  context.idToken[namespace + 'role'] = user.app_metadata.role || 'consumer';
  context.idToken[namespace + 'organization_id'] = user.app_metadata.organization_id;
  context.accessToken[namespace + 'role'] = user.app_metadata.role || 'consumer';
  context.accessToken[namespace + 'organization_id'] = user.app_metadata.organization_id;
  callback(null, user, context);
}
```

### 5.2 Set User Metadata

When creating users, set metadata:

```json
{
  "user_metadata": {
    "role": "consumer",
    "organization_id": "org_123"
  },
  "app_metadata": {
    "role": "consumer",
    "organization_id": "org_123"
  }
}
```

## Step 6: Frontend Integration

### 6.1 Install Dependencies

```bash
npm install @auth0/auth0-react
```

### 6.2 Configure Auth0Provider

Update your `Auth0Provider.tsx`:

```tsx
import { Auth0Provider } from '@auth0/auth0-react';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI;

export const AuthProvider = ({ children }) => (
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: redirectUri,
      audience: audience,
      scope: "openid profile email"
    }}
  >
    {children}
  </Auth0Provider>
);
```

## Step 7: Backend Integration

### 7.1 Install Dependencies

```bash
npm install auth0 jsonwebtoken @types/jsonwebtoken
```

### 7.2 JWT Verification

The backend uses JWT verification middleware as implemented in `api/routes/auth.ts`.

## Step 8: Testing the Setup

### 8.1 Testing Demo Mode (USE_AUTH0_MANAGEMENT=false)

1. Ensure your `.env` file has:
   ```env
   USE_AUTH0_MANAGEMENT=false
   ```

2. Start your backend server:
   ```bash
   npm run server:dev
   ```

3. Test the registration endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "name": "Test User",
       "role": "user",
       "organization_id": "org123"
     }'
   ```

   Expected response:
   ```json
   {
     "success": true,
     "message": "User registered successfully (demo mode)",
     "user": {
       "id": "auth0|1234567890",
       "email": "test@example.com",
       "name": "Test User",
       "role": "user"
     },
     "note": "Running in demo mode - set USE_AUTH0_MANAGEMENT=true for production"
   }
   ```

### 8.2 Testing Production Mode (USE_AUTH0_MANAGEMENT=true)

1. Complete all Auth0 setup steps (Applications, API, Machine-to-Machine)
2. Update your `.env` file:
   ```env
   USE_AUTH0_MANAGEMENT=true
   AUTH0_DOMAIN=your-actual-domain.auth0.com
   AUTH0_CLIENT_ID=your-actual-m2m-client-id
   AUTH0_CLIENT_SECRET=your-actual-m2m-client-secret
   AUTH0_AUDIENCE=your-actual-api-identifier
   ```

3. Restart your server and test the same endpoints
4. In production mode, actual Auth0 Management API calls will be made

### 8.3 Test Frontend Login

1. Start your frontend: `npm run dev`
2. Navigate to login page
3. Click login button - should redirect to Auth0
4. Complete authentication
5. Should redirect back with user info

### 8.4 Additional API Tests

```bash
# Test token validation
curl -X POST http://localhost:3001/api/auth/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test logout
curl -X POST http://localhost:3001/api/auth/logout
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your domain is added to Allowed Origins in Auth0
2. **Invalid Audience**: Check that API identifier matches your audience
3. **Token Verification Fails**: Verify JWT secret and algorithm
4. **Redirect Issues**: Ensure callback URLs are correctly configured

### Debug Tips

- Use Auth0's Real-time Webtask Logs for debugging
- Check browser network tab for Auth0 requests
- Verify environment variables are loaded correctly
- Use JWT.io to decode and inspect tokens

## Security Best Practices

1. **Never expose client secrets** in frontend code
2. **Use HTTPS** in production
3. **Implement proper CORS** policies
4. **Set appropriate token expiration** times
5. **Use refresh tokens** for long-lived sessions
6. **Validate tokens** on every API request
7. **Store sensitive data** in Auth0 app_metadata, not user_metadata

## Production Deployment

For production:

1. Update callback URLs to production domains
2. Use environment-specific Auth0 tenants
3. Configure custom domains in Auth0
4. Set up proper logging and monitoring
5. Implement rate limiting
6. Use Auth0's Management API for user operations

## Additional Resources

- [Auth0 React SDK Documentation](https://auth0.com/docs/libraries/auth0-react)
- [Auth0 Management API](https://auth0.com/docs/api/management/v2)
- [JWT.io Token Debugger](https://jwt.io/)
- [Auth0 Community](https://community.auth0.com/)
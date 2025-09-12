/**
 * User authentication API routes using Auth0
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { ManagementClient } from "auth0";

// Feature flag to control Auth0 Management Client usage
const USE_AUTH0_MANAGEMENT = process.env.USE_AUTH0_MANAGEMENT === "true";

// Initialize Auth0 Management Client
const auth0Domain = process.env.AUTH0_DOMAIN || "";
const auth0ClientId = process.env.AUTH0_CLIENT_ID || "";
const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET || "";
const auth0Audience = process.env.AUTH0_AUDIENCE || "";

let management = null;

if (USE_AUTH0_MANAGEMENT) {
  // In production, configure a Machine-to-Machine application in Auth0
  management = new ManagementClient({
    domain: auth0Domain,
    clientId: auth0ClientId,
    clientSecret: auth0ClientSecret,
    audience: auth0Audience,
  });
  console.log("Auth0 Management Client would be initialized here");
} else {
  console.log("Running in demo mode - Auth0 Management Client disabled");
}

// JWT verification middleware
const verifyToken = (req: any, res: Response, next: any) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, auth0ClientSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

const router = Router();

/**
 * User Registration
 * POST /api/auth/register
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      name,
      role = "consumer",
      organization_id,
    } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: "Email, password, and name are required",
      });
      return;
    }

    if (USE_AUTH0_MANAGEMENT && management) {
      // Production mode: Use Auth0 Management API
      try {
        const user = await management.createUser({
          email,
          password,
          name,
          connection: "Username-Password-Authentication",
          user_metadata: {
            role,
            organization_id,
          },
          app_metadata: {
            role,
            organization_id,
          },
        });

        res.status(201).json({
          success: true,
          message: "User registered successfully via Auth0",
          user: {
            id: user.user_id,
            email: user.email,
            name: user.name,
            role,
            email_verified: user.email_verified,
            created_at: user.created_at,
          },
        });
      } catch (auth0Error) {
        console.error("Auth0 Management API error:", auth0Error);
        res.status(500).json({
          success: false,
          error: "Failed to create user via Auth0",
        });
      }
    } else {
      // Demo mode: Simulate user creation
      const simulatedUser = {
        user_id: `auth0|${Date.now()}`, // Simulated Auth0 user ID
        email,
        name,
        email_verified: false,
        created_at: new Date().toISOString(),
        user_metadata: {
          role,
          organization_id,
        },
        app_metadata: {
          role,
          organization_id,
        },
      };

      res.status(201).json({
        success: true,
        message: "User registered successfully (demo mode)",
        user: {
          id: simulatedUser.user_id,
          email: simulatedUser.email,
          name: simulatedUser.name,
          role,
        },
        note: "Running in demo mode - set USE_AUTH0_MANAGEMENT=true for production",
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * User Profile (Auth0 handles login on frontend)
 * GET /api/auth/profile
 * Requires valid JWT token
 */
router.get(
  "/profile",
  verifyToken,
  async (req: any, res: Response): Promise<void> => {
    try {
      if (USE_AUTH0_MANAGEMENT && management) {
        // Production mode: Fetch user details from Auth0 Management API
        try {
          const userDetails = await management.getUser({ id: req.user.sub });

          res.json({
            success: true,
            user: {
              id: userDetails.user_id,
              email: userDetails.email,
              name: userDetails.name,
              role:
                userDetails.user_metadata?.role ||
                userDetails.app_metadata?.role,
              organization_id:
                userDetails.user_metadata?.organization_id ||
                userDetails.app_metadata?.organization_id,
              email_verified: userDetails.email_verified,
              picture: userDetails.picture,
              created_at: userDetails.created_at,
              last_login: userDetails.last_login,
            },
          });
        } catch (auth0Error) {
          console.error("Auth0 Management API error:", auth0Error);
          res.status(500).json({
            success: false,
            error: "Failed to fetch user profile from Auth0",
          });
        }
      } else {
        // Demo mode: Return JWT token payload
        const user = req.user;

        res.json({
          success: true,
          user: {
            id: user.sub,
            email: user.email,
            name: user.name,
            role: user.role || user["custom:role"],
            organization_id:
              user.organization_id || user["custom:organization_id"],
          },
          note: "Running in demo mode - set USE_AUTH0_MANAGEMENT=true for production",
        });
      }
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

/**
 * Validate Token
 * POST /api/auth/validate
 */
router.post(
  "/validate",
  verifyToken,
  async (req: any, res: Response): Promise<void> => {
    res.json({
      success: true,
      message: "Token is valid",
      user: req.user,
    });
  }
);

/**
 * User Logout
 * POST /api/auth/logout
 * Note: Auth0 handles logout on the frontend, this is just for API consistency
 */
router.post("/logout", async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: "Logout successful - handled by Auth0 on frontend",
  });
});

export default router;

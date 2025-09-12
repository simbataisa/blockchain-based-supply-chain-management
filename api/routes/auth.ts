/**
 * User authentication API routes using Supabase Auth
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "changeme";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "changeme";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role,
        },
      });

    if (authError) {
      res.status(400).json({
        success: false,
        error: authError.message,
      });
      return;
    }

    // Create user profile in database
    if (authData.user) {
      const { error: profileError } = await supabase.from("users").insert({
        auth_id: authData.user.id,
        email,
        name,
        role,
        organization_id,
      });

      if (profileError) {
        console.warn("Profile creation error:", profileError);
      }
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        name,
        role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
      return;
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    // Get user profile from database
    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: userProfile?.name || authData.user.user_metadata?.name,
        role: userProfile?.role || authData.user.user_metadata?.role,
        organization_id: userProfile?.organization_id,
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post("/logout", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      // Sign out the user session
      await supabase.auth.admin.signOut(token);
    }

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;

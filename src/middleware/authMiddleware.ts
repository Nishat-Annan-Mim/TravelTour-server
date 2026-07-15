import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

export interface AuthRequest extends Request {
  user?: IUser;
}

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

// Verifies JWT and attaches user to request
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header (Bearer token)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Fallback: check cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res
        .status(401)
        .json({ success: false, message: "Not authorized, no token provided" });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res
        .status(500)
        .json({ success: false, message: "Server configuration error" });
      return;
    }

    const decoded = jwt.verify(token, secret) as DecodedToken;

    const user = await User.findById(decoded.id);
    if (!user) {
      res
        .status(401)
        .json({ success: false, message: "Not authorized, user not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Not authorized, token failed" });
  }
};

// Restricts access to specific roles (e.g., admin-only routes)
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authorized" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
      return;
    }

    next();
  };
};

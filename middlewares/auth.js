import jwt from "jsonwebtoken";
import Response from "../lib/Response.js";

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .send(new Response(false, "Access denied. No token provided."));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(400)
      .send(new Response(false, "Invalid token.", null, error.message));
  }
};

export default authMiddleware;

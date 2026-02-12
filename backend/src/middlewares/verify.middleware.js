const jwt = require("jsonwebtoken");
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const secret = process.env.JWT_SECRET || "SECRET_KEY";
    // Decode header to inspect algorithm without verifying
    const decodedHeader = jwt.decode(token, { complete: true });

    // Log presence of secret (masked) and token preview for debugging
    const hasSecret = !!process.env.JWT_SECRET;
    const maskedSecret = hasSecret ? process.env.JWT_SECRET.replace(/.(?=.{4})/g, '*') : '(default)';
    const tokenPreview = token ? `${token.slice(0,8)}...${token.slice(-8)}` : '(none)';
  

    // Support RSA-signed tokens if a public key is provided
    let decoded;
    const alg = decodedHeader?.header?.alg || "";
    if (alg.startsWith("RS")) {
      const pubKey = process.env.JWT_PUBLIC_KEY;
      if (!pubKey) {
        throw new Error("Token uses RSA algorithm but no JWT_PUBLIC_KEY is set in the environment");
      }
      decoded = jwt.verify(token, pubKey, { algorithms: [alg] });
    } else {
      decoded = jwt.verify(token, secret);
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;

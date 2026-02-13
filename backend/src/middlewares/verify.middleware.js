const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const secret = (process.env.JWT_SECRET || '').trim();
    
    if (!secret) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Decode header to inspect algorithm without verifying
    const decodedHeader = jwt.decode(token, { complete: true });

    if (!decodedHeader) {
      return res.status(403).json({ message: "Invalid token format" });
    }

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
    if (error.message.includes('signature')) {
      console.error("Signature mismatch - check JWT_SECRET");
    }
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;

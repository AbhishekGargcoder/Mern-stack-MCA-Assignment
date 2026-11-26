import jwt from "jsonwebtoken";

const generateToken = (user) =>
  jwt.sign(
    { sub: String(user.id) },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

export default generateToken;

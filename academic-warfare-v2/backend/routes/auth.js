import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "../db.js";

const router = Router();

// ── POST /api/auth/register ─────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password, section } = req.body;

  if (!name || !email || !password || !section)
    return res.status(400).json({ error: "All fields are required." });

  if (!email.endsWith("@utdallas.edu"))
    return res.status(400).json({ error: "Must use a @utdallas.edu email." });

  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters." });

  try {
    const db = getDB();
    const existing = await db.collection("users").findOne({ email });
    if (existing)
      return res.status(409).json({ error: "An account with that email already exists." });

    const hash = await bcrypt.hash(password, 12);
    const user = {
      name,
      email,
      password: hash,
      section,
      elo: 1200,
      wins: 0,
      losses: 0,
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(user);

    const token = jwt.sign(
      { id: result.insertedId, email, name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: result.insertedId, name, email, section, elo: 1200 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// ── POST /api/auth/login ────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required." });

  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ email });

    if (!user)
      return res.status(401).json({ error: "Invalid email or password." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Invalid email or password." });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        section: user.section,
        elo: user.elo,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────
import { requireAuth } from "../middleware/auth.js";
import { ObjectId } from "mongodb";

router.get("/me", requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(req.user.id) }, { projection: { password: 0 } });

    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

export default router;

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  domain: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

// ✅ FIXED Default Route (signin.html as homepage)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signin.html"));
});

// Signup
app.post("/signup", async (req, res) => {
  const { username, password, domain } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists) return res.send("⚠️ Username already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
      domain
    });

    await user.save();
    res.redirect("/signin.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Signup Error");
  }
});

// Signin
app.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.send("❌ User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("⚠️ Invalid Password");

    console.log("Logged in user domain:", user.domain);

    // Successful login redirect
    res.redirect("https://ocl-vwir.vercel.app/");
  } catch (err) {
    res.status(500).send("❌ Login Error");
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

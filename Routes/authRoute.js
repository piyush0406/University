import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import express from "express";
import { ConnectToDatabase } from "../helpers/db-helper.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Register a new user

const conn = await ConnectToDatabase();
const userCol = conn.db("University").collection("users");

router.post("/register", async (req, res) => {
  try {
    const { universityId, password } = req.body;
    const checkUser = await userCol.findOne({ universityId });
    if (checkUser) {
      res.status(500).send("user already registered");
      return
    }
    const hashedPassword = await bcrypt.hash(password, 14);
    console.log("asdjfhjasdhkjfhsdkfjhas");
    const user = {
      universityId,
      password: hashedPassword,
    };

    await userCol.insertOne(user);
    res.status(201).send("User registered successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error registering user");
  }
});

// Login and receive a JWT token
router.post("/login", async (req, res) => {
  try {
    const { universityId, password } = req.body;
    const user = await userCol.findOne({ universityId });

    if (!user) {
      return res.status(401).send("Invalid credentials");
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ universityId: user.universityId ,access_type:user.access_type }, process.env.SECRET_KEY);
      res.json({ token });
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging in");
  }
});

export default router;

// const express = require('express');
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
// import {express} from "express"
import { v4 as uuidv4 } from "uuid";
import { ConnectToDatabase } from "./helpers/db-helper.js";
import bodyParser from "body-parser";
import authRoutes from "./Routes/authRoute.js";
import sessionRoutes from "./Routes/sessionRoute.js"
import { authenticateToken } from "./middlewares/authMiddleware.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// const User = require("./models/User");
// const Session = require("./models/Session");

const conn = await ConnectToDatabase();

app.use(authRoutes);
app.use(sessionRoutes)
app.get("/", (req, res) => {
  res.json({ hello: "world" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

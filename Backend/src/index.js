import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import path from "path";
dotenv.config();
// const app = express();
const __dirname = path.resolve();

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use((req, res, next) => {
  console.log("Request Origin:", req.headers.origin);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
const PORT = process.env.PORT;

console.log("dirname:");
if (process.env.NODE_ENV === "production") {
  console.log("dirname2222:");

  app.use(express.static(path.join(__dirname, "../ChatApp/dist")));

  app.get("/", (req, res) => {
    console.log("dirname399:");

    res.sendFile(path.resolve(__dirname, "../ChatApp/dist/index.html"));
  });
}

server.listen(PORT, () => {
  console.log("serveer is listening");
  connectDB();
});

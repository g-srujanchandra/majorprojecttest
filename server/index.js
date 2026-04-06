import express from "express";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Auth from "./Routes/AuthRoute.js";
import cors from "cors";

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());
const port = process.env.PORT || 5000;

// 🔓 PERMISSIVE CORS: Allow all origins to bypass cloud routing blocks
app.use(cors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 200
}));

// 🏥 HEALTH CHECK: Verify the domain is reachable
app.get("/health", (req, res) => res.send("OK - Server is Live"));

// 🌐 ROUTING: Support both root "/" and "/api/auth/" paths for max compatibility
app.use("/", Auth); 
app.use("/api/auth", Auth); 

app.use("/Faces", express.static("Faces"));

mongoose.set('strictQuery', false);
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected With DB Successfull"))
  .catch((e) => {
    console.log("Db Connection Failed");
    console.error(e);
  });

app.listen(port, () => {
  console.log(`Server is Listening on PORT ${port}`);
});

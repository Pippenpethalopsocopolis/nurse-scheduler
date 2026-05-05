import express from "express";
import cors from "cors";
import { runGA } from "./ga.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate", (req, res) => {
    const { nurses, days, shifts } = req.body;
    
    const result = runGA(nurses, days, shifts);
    res.json({ schedule: result });
});

app.listen(3001, () => console.log("Server running"));
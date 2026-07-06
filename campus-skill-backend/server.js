require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/skills', require('./routes/skillRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/campus-skill")
.then(()=>{
    console.log("MongoDB Connected");
})
.catch((err)=>{
    console.log(err);
});
const userRoutes=require("./routes/userRoutes");

app.use("/api/users",userRoutes);
const userRoutes=require("./routes/userRoutes");

app.use("/api/skills",skillRoutes);
const userRoutes=require("./routes/userRoutes");

app.use("/api/requests",requestRoutes);
const userRoutes=require("./routes/userRoutes");

app.use("/api/messages",messageRoutes);
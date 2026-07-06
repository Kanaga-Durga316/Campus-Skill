const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    college:String,
    department:String,
    year:Number,
    profileImage:String,
    bio:String,
    rating:Number
});

module.exports = mongoose.model("User",userSchema);
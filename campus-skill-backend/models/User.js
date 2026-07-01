const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  college: String,
  department: String,
  year: Number,
  skillsOffered: [String],
  skillsWanted: [String]
});

module.exports = mongoose.model("User", userSchema);
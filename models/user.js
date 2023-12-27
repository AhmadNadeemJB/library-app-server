const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

async function connectToDB() {
  mongoose
    .connect(
      "mongodb+srv://ahmadnadeemjb:Ahmad@cluster0.hqqhtpr.mongodb.net/BookLibrarySystem?retryWrites=true&w=majority"
    )
    .then(console.log("Connected to DB from user.js"))
    .catch((error) => handleError(error));
}
connectToDB();

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, maxlength: 50 },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^\S+@\S+\.\S+$/,
    maxlength: 200,
    lowercase: true,
  },
  password: { type: String, required: true, minlength: 6, maxlength: 200 },
  favoriteBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
  reviewedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

module.exports = User;

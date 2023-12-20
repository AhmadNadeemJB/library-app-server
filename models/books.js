const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Author" },
  ISBN: String,
  genre: String,
  description: String,
  publishedDate: {
    type: Date,
    default: Date.now,
  },
  coverImage: String,
  copiesAvailable: Number,
  ratings: [Number],
  reviews: [
    {
      username: { type: mongoose.Schema.Types.ObjectId, ref: "Username" },
      text: String,
      rating: Number,
    },
  ],
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// mongodb connection
const MONGOURL =
  "mongodb+srv://okase:NeqEO4YT0qOdpYul@checkmate.7emwt.mongodb.net/?retryWrites=true&w=majority&appName=checkmate";

try {
  mongoose.connect(MONGOURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to MongoDB");
} catch (error) {
  console.log(error);
}

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
});

const Contact = mongoose.model("Contact", contactSchema);



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// const config = require("./config.json");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const express = require("express");
const { authenticateToken } = require("./utilities");
const upload = require("./multer"); // Import multer configuration
const fs = require("fs");
const path = require("path");

// MongoDB connection
mongoose
  .connect(process.env.ConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const User = require("./models/user.model");
const TravelStory = require("./models/travelStory.model");

const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors({ origin: "*" })); // Enable CORS

// Route: Create Account
app.post("/create-account", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ error: true, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: true, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Ensure secret exists
    const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!jwtSecret) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined in .env");
    }

    const accessToken = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: "108h",
    });

    return res.status(201).json({
      error: false,
      user: { fullName: user.fullName, email: user.email },
      accessToken,
      message: "Account created successfully",
    });
  } catch (err) {
    console.error("Error in /create-account:", err);
    return res.status(500).json({
      error: true,
      message: "Something went wrong",
      details: err.message,
    });
  }
});

//Login:
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: true, message: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: true, message: "Invalid password" });
  }

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "72h" }
  );
  return res.status(200).json({
    error: false,
    message: "Login successful",
    accessToken,
    user: { fullName: user.fullName, email: user.email },
    accessToken,
  });
});

//Get User
app.get("/get-user", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const isUser = await User.findOne({ _id: userId });

  if (!isUser) {
    return res.sendStatus(401);
  }

  return res.json({
    user: isUser,
    message: "",
  });
});

//Route to Handle image upload
app.post("/image-upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: "No file uploaded" });
    }
    const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;

    res.status(200).json({
      error: false,
      message: "Image uploaded successfully",
      imageUrl,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Failed to upload image",
      details: error.message,
    });
  }
});

//delete an image from uploads directory:
app.delete("/delete-image", async (req, res) => {
  const { imageUrl } = req.query;

  if (!imageUrl) {
    return res
      .status(400)
      .json({ error: true, message: "Image URL is required" });
  }

  try {
    //extract filename from imageURL
    const filename = path.basename(imageUrl);
    const filePath = path.join(__dirname, "uploads", filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); //delete the file
      return res
        .status(200)
        .json({ error: false, message: "Image deleted successfully" });
    } else {
      return res.status(404).json({ error: true, message: "Image not found" });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Failed to delete image",
      details: error.message,
    });
  }
});

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

//Add Travel Story
app.post("/add-travel-story", authenticateToken, async (req, res) => {
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { userId } = req.user;

  //validate required fields
  if (!title || !story || !imageUrl || !visitedDate || !visitedLocation) {
    return res.status(400).json({
      error: true,
      message: "Title, story, imageUrl, and visitedDate are required",
    });
  }

  // Convert vistedDate from milliseconds to Date object
  const parsedVisitedDate = new Date(parseInt(visitedDate));

  try {
    const travelStory = new TravelStory({
      title,
      story,
      visitedLocation,
      userId,
      imageUrl,
      visitedDate: parsedVisitedDate,
    });
    await travelStory.save();
    res
      .status(201)
      .json({ story: travelStory, message: "Travel story added successfully" });
  } catch (error) {
    res.status(400).json({
      error: true,
      message: "Failed to add travel story",
      details: error.message,
    });
  }
});

//Get all Travel Stories
app.get("/get-all-stories", authenticateToken, async (req, res) => {
  const { userId } = req.user;

  try {
    const travelStories = await TravelStory.find({ userId }).sort({
      isFavourite: -1,
    });
    res.status(200).json({
      stories: travelStories,
      message: "Travel stories fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

//Edit travel Story
app.post("/edit-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { userId } = req.user;

  //validate required fields
  if (!title || !story || !visitedDate || !visitedLocation) {
    return res.status(400).json({
      error: true,
      message: "Title, story, imageUrl, and visitedDate are required",
    });
  }

  // Convert vistedDate from milliseconds to Date object
  const parsedVisitedDate = new Date(parseInt(visitedDate));

  try {
    //Find the travel story by ID and userId
    const travelStory = await TravelStory.findOneAndUpdate({ _id: id, userId });
    if (!travelStory) {
      return res.status(404).json({ error: true, message: "Story not found" });
    }
    const placeholderImgUrl = `http://localhost:8000/assets/placeholder.jpg`;

    travelStory.title = title;
    travelStory.story = story;
    travelStory.visitedLocation = visitedLocation;
    travelStory.imageUrl = imageUrl || placeholderImgUrl; // Use placeholder if no image
    travelStory.visitedDate = parsedVisitedDate;

    await travelStory.save();
    res.status(200).json({
      story: travelStory,
      message: "Travel story edited successfully",
    });
  } catch (error) {
    return res.status(400).json({
      message: "Failed to edit travel story",
      error: true,
      details: error.message,
    });
  }
});

//Delete travel story
app.delete("/delete-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    //Find the travel story and ensure it belongs to the authenticated user
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });
    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel Story not found" });
    }

    //Delete the Travel story from the database:
    await travelStory.deleteOne({ _id: id, userId: userId });

    //Extract the filename from the url:
    const imageUrl = travelStory.imageUrl;
    const filename = path.basename(imageUrl);

    //Define the file path
    const filePath = path.join(__dirname, "uploads", filename);

    //Delete the image file the uploads folder
    fs.unlinkSync(filePath, (err) => {
      if (err) {
        console.log("Failed to delete image", err);
      }
    });
    res.status(200).json({ message: "Travel Story is deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

//update isFavourite
app.put("/update-is-favourite/:id", authenticateToken, async (req, res) => {
  const { id } = req.params; // Get id from URL param
  const { isFavourite } = req.body;
  const { userId } = req.user;

  try {
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found!" });
    }

    travelStory.isFavourite = isFavourite;
    await travelStory.save();

    res.status(200).json({ message: "isFavourite updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

//Search Travel Stories:
app.get("/search-stories", authenticateToken, async (req, res) => {
  const { query } = req.query;
  const { userId } = req.user;

  if (!query) {
    return res
      .status(400)
      .json({ error: true, message: "Please enter a search query" });
  }
  try {
    const searchResults = await TravelStory.find({
      userId: userId,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { story: { $regex: query, $options: "i" } },
        { visitedLocation: { $regex: query, $options: "i" } },
      ],
    }).sort({ isFavourite: -1 });
    res.status(200).json({ stories: searchResults });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

//Filter travel stories by date range
app.get("/travel-stories/filter", authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  const { userId } = req.user;

  try {
    //Convert startDate and endDate from milliseconds to Date objects
    const start = new Date(parseInt(startDate));
    const end = new Date(parseInt(endDate));
    //Find travel stories that belong to the authenticated user and fall within the date range
    const filteredStories = await TravelStory.find({
      userId: userId,
      visitedDate: { $gte: start, $lte: end },
    }).sort({ isFavourite: -1 });
    res.status(200).json({ stories: filteredStories });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

// Start server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

module.exports = app;

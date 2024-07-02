/*
Lakshmi Priyanka Annapureddy
N01537387
*/
require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Middleware
app.use(express.urlencoded({ extended: true })); // handle normal forms -> url encoded
app.use(express.json()); // Handle raw json data


// Part2: Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Part2: Routes
app
  .route("/upload")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "views", "upload.html"));
  })
  .post(upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    res.send(`File uploaded successfully: ${req.file.path}`);
  });

app
  .route("/upload-multiple")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "views", "upload-multiple.html"));
  })
  .post(upload.array("files", 15), (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    const filePaths = req.files.map((file) => file.path);
    res.status(200).send(`Files uploaded successfully: ${filePaths.join(", ")}`);
  });


//Part 3 Sending the file over
app.get("/fetch-single", (req, res) => {
  let upload_dir = path.join(__dirname, "uploads");

  // Read the directory to get the list of files
  let uploads = fs.readdirSync(upload_dir);

  // Add error handling
  if (uploads.length === 0) {
    console.log("No images found in the uploads directory.");
    return res.status(503).send({
      message: "No images",
    });
  }

  // Get a random index
  let max = uploads.length - 1;
  let min = 0;
  let index = Math.floor(Math.random() * (max - min + 1)) + min;
  let randomImage = uploads[index];
  console.log("Sending file:", randomImage);

  // Send the random file
  res.sendFile(path.join(upload_dir, randomImage), (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error sending file");
    }
  });
});


// Route to serve fetch-multiple-images.html
app.get("/fetch-multiple-images", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "fetch-multiple-images.html"));
});

// Route to handle the request from the form
app.post("/fetch-multiple", (req, res) => {
  const { numImages } = req.body;
  const uploadDir = path.join(__dirname, "uploads");
  const uploads = fs.readdirSync(uploadDir);

  if (uploads.length === 0) {
    return res.status(503).send({ message: "No images" });
  }

  // Get random images
  const randomImages = [];
  for (let i = 0; i < numImages; i++) {
    const randomIndex = Math.floor(Math.random() * uploads.length);
    const randomImage = uploads[randomIndex];
    const imageBuffer = fs.readFileSync(path.join(uploadDir, randomImage));
    const imageBase64 = imageBuffer.toString("base64");
    randomImages.push(imageBase64);
  }

  res.json(randomImages);
});

// Route to serve fetch-image.html
app.get("/fetch-image", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "fetch-image.html"));
});

// Route to fetch all images
// Route to fetch all images
app.get("/fetch-all", (req, res) => {
  const allFiles = getAllFiles();
  res.json(allFiles);
});


// Route to showcase all files in a gallery (without pagination)
app.get("/gallery", (req, res) => {
  const galleryPath = path.join(__dirname, "views", "gallery.html");
  res.sendFile(galleryPath);
});

//Pagination part
app.get("/gallery-pagination", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "gallery-pagination.html"));
});

app.get("/fetch-all/pages/:index", (req, res) => {
  const ITEMS_PER_PAGE = parseInt(req.query.items_per_page, 10) || 10;
  const pageIndex = parseInt(req.params.index, 10);
  if (isNaN(pageIndex) || pageIndex < 1) {
    return res.status(400).send("Invalid page index.");
  }

  const allFiles = Object.entries(getAllFiles());
  const totalItems = allFiles.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (pageIndex > totalPages) {
    return res.status(404).send("Page not found.");
  }

  const startIndex = (pageIndex - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const pageItems = allFiles.slice(startIndex, endIndex);

  const response = {
    page: pageIndex,
    totalPages: totalPages,
    files: Object.fromEntries(pageItems),
  };

  res.json(response);
});


// Function to fetch all files and convert to base64
const getAllFiles = () => {
  const directoryPath = path.join(__dirname, "uploads");
  const files = fs.readdirSync(directoryPath);
  const fileContents = {};

  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const content = fs.readFileSync(filePath);
    fileContents[file] = content;
  });

  return fileContents;
};


//   // Set up view engine
//   app.set("views", path.join(__dirname, "views"));
//   app.set("view engine", "html");

// Catch all other requests
app.use((req, res) => {
  res.status(404).send("Route not found");
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
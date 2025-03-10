const fs = require("fs");
const path = require("path");

// Define source and destination directories
const sourceDir = path.join(__dirname, "../src/public");
const destDir = path.join(__dirname, "../dist/public");

// Create the destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

// Function to copy a file
function copyFile(source, destination) {
  fs.copyFileSync(source, destination);
  console.log(`Copied: ${source} -> ${destination}`);
}

// Function to copy a directory recursively
function copyDir(source, destination) {
  // Create the destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
    console.log(`Created directory: ${destination}`);
  }

  // Get all files and subdirectories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // Copy each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(sourcePath, destPath);
    } else {
      // Copy files
      copyFile(sourcePath, destPath);
    }
  }
}

// Start the copy process
try {
  console.log("Copying static files...");
  copyDir(sourceDir, destDir);
  console.log("Static files copied successfully!");
} catch (error) {
  console.error("Error copying static files:", error);
  process.exit(1);
}

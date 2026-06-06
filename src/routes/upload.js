const express = require("express");
const { upload } = require("../middleware/upload");
const { uploadImage } = require("../services/s3");

const router = express.Router();

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided. Use field name 'image'." });
    }

    const result = await uploadImage(req.file);

    return res.status(201).json({
      url: result.url,
      key: result.key,
      contentType: result.contentType,
      size: result.size,
    });
  } catch (err) {
    console.error("Upload failed:", err);
    return res.status(500).json({ error: "Failed to upload image" });
  }
});

module.exports = router;

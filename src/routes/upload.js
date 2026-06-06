import express from "express";
import { resolveNodeConfig } from "../config.js";
import { upload } from "../middleware/upload.js";
import { uploadImage } from "../services/s3.js";

const router = express.Router();

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided. Use field name 'image'." });
    }

    const result = await uploadImage(req.file, resolveNodeConfig());
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

export default router;

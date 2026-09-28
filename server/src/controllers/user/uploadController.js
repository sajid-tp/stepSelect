// controllers/uploadController.js
const cloudinary = require('../../config/cloudinary');

const uploadImage = async (req, res, next) => {
  try {
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(fileStr, {
      folder: 'stepSelect',
    });

    res.status(200).json({ url: result.secure_url });
  } catch (err) {
     next(err)
  }
};

const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadPromises = req.files.map((file) => {
      const fileStr = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return cloudinary.uploader.upload(fileStr, { folder: 'stepSelect' });
    });

    const results = await Promise.all(uploadPromises);
    const urls = results.map((result) => result.secure_url);

    res.status(200).json({ urls });
  } catch (err) {
    next(err)
  }
};

module.exports = { uploadImage, uploadMultipleImages };
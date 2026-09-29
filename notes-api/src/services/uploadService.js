const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { UPLOAD_DIR } = require('../config/paths');

class UploadService {
  constructor() {
    this.uploadDir = UPLOAD_DIR;
    this.baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true, mode: 0o755 });
        console.log(`✓ Created upload directory: ${this.uploadDir}`);
      }
    } catch (error) {
      console.error('Error creating upload directory:', error);
      throw error;
    }
  }

  generateUniqueFilename(originalName, extension) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const nameWithoutExt = path.basename(originalName, path.extname(originalName));
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    return `${sanitizedName}_${timestamp}_${randomString}${extension}`;
  }

  async uploadFile(file) {
    try {
      const isImage = file.mimetype && file.mimetype.startsWith('image/');
      const isVideo = file.mimetype && file.mimetype.startsWith('video/');

      let filename;
      let filePath;
      let fileSize;
      let format;
      let resourceType;
      let mimetype;

      if (isImage) {
        filename = this.generateUniqueFilename(file.name, '.webp');
        filePath = path.join(this.uploadDir, filename);

        const imageBuffer = await sharp(file.data)
          .webp({ quality: 80 })
          .toBuffer();

        fs.writeFileSync(filePath, imageBuffer);
        fileSize = imageBuffer.length;
        format = 'webp';
        resourceType = 'image';
        mimetype = 'image/webp';
      } else if (isVideo) {
        const extension = path.extname(file.name);
        filename = this.generateUniqueFilename(file.name, extension);
        filePath = path.join(this.uploadDir, filename);

        fs.writeFileSync(filePath, file.data);
        fileSize = file.data.length;
        format = extension.slice(1);
        resourceType = 'video';
        mimetype = file.mimetype;
      } else {
        const extension = path.extname(file.name);
        filename = this.generateUniqueFilename(file.name, extension);
        filePath = path.join(this.uploadDir, filename);

        fs.writeFileSync(filePath, file.data);
        fileSize = file.data.length;
        format = extension.slice(1);
        resourceType = 'raw';
        mimetype = file.mimetype;
      }

      const stats = fs.statSync(filePath);

      return {
        public_id: path.parse(filename).name,
        url: `${this.baseUrl}/files/${filename}`,
        secure_url: `${this.baseUrl}/files/${filename}`,
        format,
        resource_type: resourceType,
        bytes: fileSize,
        created_at: stats.birthtime.toISOString(),
        filename,
        original_filename: file.name,
        mimetype,
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadMultipleFiles(files) {
    try {
      const fileArray = Array.isArray(files) ? files : [files];

      if (fileArray.length > 10) {
        throw new Error('Maximum 10 files allowed per upload');
      }

      const uploadPromises = fileArray.map((file) => this.uploadFile(file));
      const results = await Promise.all(uploadPromises);

      return results;
    } catch (error) {
      throw error;
    }
  }

  async deleteFile(publicId) {
    try {
      const files = fs.readdirSync(this.uploadDir);

      const fileToDelete = files.find((file) => {
        const fileNameWithoutExt = path.parse(file).name;
        return fileNameWithoutExt === publicId || file === publicId;
      });

      if (!fileToDelete) {
        return {
          result: 'not found',
          publicId,
        };
      }

      const filePath = path.join(this.uploadDir, fileToDelete);
      fs.unlinkSync(filePath);

      return {
        result: 'ok',
        publicId,
        filename: fileToDelete,
      };
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async getFileInfo(filename) {
    try {
      const filePath = path.join(this.uploadDir, filename);

      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const stats = fs.statSync(filePath);
      const extension = path.extname(filename).slice(1);

      return {
        filename,
        public_id: path.parse(filename).name,
        url: `${this.baseUrl}/files/${filename}`,
        size: stats.size,
        created_at: stats.birthtime,
        modified_at: stats.mtime,
        format: extension,
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  async listFiles() {
    try {
      const files = fs.readdirSync(this.uploadDir);

      return files.map((filename) => {
        const filePath = path.join(this.uploadDir, filename);
        const stats = fs.statSync(filePath);

        return {
          filename,
          public_id: path.parse(filename).name,
          url: `${this.baseUrl}/files/${filename}`,
          size: stats.size,
          created_at: stats.birthtime,
        };
      });
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
}

module.exports = new UploadService();
import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    this.logger.log('CloudinaryService initialized successfully.');
  }

  async uploadFile(filePathOrBase64: string, options: UploadApiOptions = {}): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        filePathOrBase64,
        {
          folder: 'campassist',
          resource_type: 'auto',
          ...options,
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error:', error);
            return reject(error);
          }
          resolve(result!);
        },
      );
    });
  }

  async deleteFile(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          this.logger.error('Cloudinary delete error:', error);
          return reject(error);
        }
        resolve(result);
      });
    });
  }
}


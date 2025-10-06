import { injectable, inject } from "inversify";
import { UploadedFile } from "express-fileupload";
import { TYPES } from "../../shared/types/service.types";
import { ImageType } from "../../../generated/prisma";
import { v7 as uuidv7 } from "uuid";
import path from "path";
import fs from "fs/promises";
import {
  IFileService,
  IFileRepository,
  UploadResult,
  ImageData,
  CreateImageData
} from "../interfaces/file.interfaces";

@injectable()
export class FileService implements IFileService {
  private readonly uploadDir = path.join(process.cwd(), "public", "images");

  constructor(
    @inject(TYPES.FileRepository) private fileRepository: IFileRepository
  ) {
    // Ensure upload directory exists
    this.ensureUploadDirExists();
  }

  /**
   * Upload multiple images for an item
   */
  async uploadItemImages(files: UploadedFile[]): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      return [];
    }

    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      if (!this.isValidImageFile(file)) {
        throw new Error(`Invalid image file: ${file.name}`);
      }

      // Generate unique filename
      const fileExtension = path.extname(file.name);
      const fileName = `${uuidv7()}${fileExtension}`;
      const filePath = path.join(this.uploadDir, fileName);
      const url = `/images/${fileName}`;

      // Save file to disk
      await file.mv(filePath);

      results.push({
        fileName,
        filePath,
        url
      });
    }

    return results;
  }

  /**
   * Save image records to database
   */
  async saveItemImages(itemId: string, uploadResults: UploadResult[], uploadedBy: string): Promise<ImageData[]> {
    if (!uploadResults || uploadResults.length === 0) {
      return [];
    }

    const imageData: CreateImageData[] = uploadResults.map((result, index) => ({
      url: result.url,
      altText: `Item image ${index + 1}`,
      isPrimary: index === 0, // First image is primary
      imageType: ImageType.ITEM,
      itemId,
      uploadedBy
    }));

    return await this.fileRepository.createImages(imageData);
  }

  /**
   * Get all images for an item
   */
  async getItemImages(itemId: string): Promise<ImageData[]> {
    return await this.fileRepository.findImagesByItemId(itemId);
  }

  /**
   * Delete all images for an item
   */
  async deleteItemImages(itemId: string): Promise<void> {
    // Get images before deleting to clean up files
    const images = await this.fileRepository.findImagesByItemId(itemId);

    // Delete from database
    await this.fileRepository.deleteImagesByItemId(itemId);

    // Clean up physical files
    await this.cleanupPhysicalFiles(images);
  }

  /**
   * Clean up orphaned files
   */
  async cleanupOrphanedFiles(): Promise<void> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const orphanedImages = await this.fileRepository.findOrphanedImages(oneWeekAgo);

    if (orphanedImages.length > 0) {
      const imageIds = orphanedImages.map(img => img.id);
      await this.fileRepository.deleteImagesByIds(imageIds);
      await this.cleanupPhysicalFiles(orphanedImages);
    }
  }

  /**
   * Validate if file is a valid image
   */
  private isValidImageFile(file: UploadedFile): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
      return false;
    }

    if (file.size > maxSize) {
      return false;
    }

    return true;
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirExists(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Clean up physical files from disk
   */
  private async cleanupPhysicalFiles(images: ImageData[]): Promise<void> {
    for (const image of images) {
      try {
        const filePath = path.join(process.cwd(), "public", image.url);
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore errors when deleting files (file might not exist)
        console.warn(`Failed to delete file: ${image.url}`, error);
      }
    }
  }
}
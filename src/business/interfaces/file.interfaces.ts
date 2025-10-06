import { ImageType } from "../../../generated/prisma";
import { UploadedFile } from "express-fileupload";

export interface ImageData {
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
    imageType: ImageType;
    itemId: string;
    uploadedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UploadResult {
    fileName: string;
    filePath: string;
    url: string;
}

export interface CreateImageData {
    url: string;
    altText?: string;
    isPrimary: boolean;
    imageType: ImageType;
    itemId: string;
    uploadedBy: string;
}

/**
 * Repository interface for file and image-related data operations
 */
export interface IFileRepository {
    // Image operations
    createImages(imageData: CreateImageData[]): Promise<ImageData[]>;
    findImagesByItemId(itemId: string): Promise<ImageData[]>;
    deleteImagesByItemId(itemId: string): Promise<void>;
    deleteImagesByIds(imageIds: string[]): Promise<void>;
    updateImagePrimary(itemId: string, imageId: string): Promise<void>;

    // File cleanup operations
    findOrphanedImages(beforeDate: Date): Promise<ImageData[]>;
}

/**
 * Service interface for file handling operations
 */
export interface IFileService {
    // File upload operations
    uploadItemImages(files: UploadedFile[]): Promise<UploadResult[]>;
    saveItemImages(itemId: string, uploadResults: UploadResult[], uploadedBy: string): Promise<ImageData[]>;

    // File management
    getItemImages(itemId: string): Promise<ImageData[]>;
    deleteItemImages(itemId: string): Promise<void>;
    cleanupOrphanedFiles(): Promise<void>;
}

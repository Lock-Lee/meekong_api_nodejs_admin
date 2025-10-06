import { MediaType } from "../../../generated/prisma";

export interface PresignRequest {
    itemId: string;
    type: MediaType;
    contentType: string;
    fileName: string;
    size: number;
    multipart?: boolean;
    userId: string;
}

export interface PresignPart {
    partNumber: number;
    uploadUrl: string;
}

export interface PresignResponse {
    key: string;
    uploadUrl?: string;
    headers?: Record<string, string>;
    uploadId?: string;
    parts?: PresignPart[];
}

export interface CompleteUploadRequest {
    itemId: string;
    type: MediaType;
    key: string;
    size?: number;
    contentType?: string;
    uploadId?: string;
    parts?: { partNumber: number; etag: string }[];
    userId: string;
}

export interface MediaRecord {
    id: string;
    url: string;
    mediaType: MediaType;
    isPrimary?: boolean;
}

export interface IMediaRepository {
    countImages(itemId: string): Promise<number>;
    hasVideo(itemId: string): Promise<boolean>;
    isItemOwnedBy(itemId: string, userId: string): Promise<boolean>;
    createImage(itemId: string, url: string, isPrimary: boolean, userId: string): Promise<MediaRecord>;
    createVideo(itemId: string, url: string, userId: string): Promise<MediaRecord>;
    listItemMedia(itemId: string): Promise<MediaRecord[]>;
    getMediaOwnership(mediaId: string): Promise<{ itemId: string; sellerId: string; url: string; mediaType: MediaType; isPrimary: boolean } | null>;
    deleteMedia(mediaId: string): Promise<void>;
    setPrimary(itemId: string, imageId: string, userId: string): Promise<void>;
}

export interface IS3PresignService {
    presignSingle(key: string, contentType: string, maxBytes: number): Promise<{ url: string; headers: Record<string, string> }>;
}

export interface IMediaService {
    listItemMedia(itemId: string): Promise<MediaRecord[]>;
    presignUpload(request: PresignRequest): Promise<PresignResponse>;
    completeUpload(request: CompleteUploadRequest): Promise<MediaRecord>;
    deleteMedia(mediaId: string, userId: string): Promise<void>;
    setPrimaryImage(itemId: string, imageId: string, userId: string): Promise<void>;
}



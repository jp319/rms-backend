import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-toolkit";

import { propertiesRepository } from "@/modules/properties/properties.repository";
import { propertiesService } from "@/modules/properties/properties.service";
import { propertyImagesRepository } from "@/modules/property-images/property-images.repository";
import { s3Helpers } from "@/shared/s3-helpers";

import type { CreatePropertyImageInput } from "./property-images.schema";

export const propertyImagesService = {
  // 1. Generate Presigned URL
  getUploadUrl: async (
    propertyId: number,
    ownerId: number,
    fileName: string,
    contentType: string,
  ) => {
    // Verify Owner
    await propertiesService.findOne(propertyId, ownerId);

    // Generate unique path: properties/{propId}/{random}.jpg
    const ext = fileName.split(".").pop();
    const key = `properties/${propertyId}/${crypto.randomUUID()}.${ext}`;

    const uploadUrl = await s3Helpers.createPresignedUploadUrl(
      key,
      contentType,
    );

    return { uploadUrl, key };
  },

  // 2. Save Metadata
  create: async (
    propertyId: number,
    ownerId: number,
    data: CreatePropertyImageInput,
  ) => {
    const property = await propertiesRepository.checkOwner(propertyId, ownerId);

    if (!property) {
      throw new HTTPException(StatusCodes.NOT_FOUND, {
        message: "Property not found",
      });
    }

    // Transform Key to Public URL (if your schema expects a full URL)
    // Or keep it as a Key and transform on read.
    // Assuming schema stores Full URL based on your SQL file:
    const fullUrl = data.url.startsWith("http")
      ? data.url
      : s3Helpers.getPublicUrl(data.url);

    return await propertyImagesRepository.create(propertyId, {
      ...data,
      url: fullUrl,
    });
  },

  // 3. List
  findAll: async (propertyId: number, ownerId: number) => {
    const property = await propertiesRepository.checkOwner(propertyId, ownerId);

    if (!property) {
      throw new HTTPException(StatusCodes.NOT_FOUND, {
        message: "Property not found",
      });
    }

    return await propertyImagesRepository.findByPropertyId(property.id);
  },

  // 4. Delete
  delete: async (imageId: number, propertyId: number, ownerId: number) => {
    // Verify Property Ownership
    await propertiesService.findOne(propertyId, ownerId);

    // Verify Image exists
    const image = await propertyImagesRepository.findById(imageId);
    if (!image) throw new HTTPException(StatusCodes.NOT_FOUND);

    // Delete from S3 (Extract key from URL if necessary)
    // Simple extraction logic (adjust based on your URL structure)
    const key = s3Helpers.extractS3Key(image.url);
    if (key) {
      await s3Helpers.deleteFile(key);
    }

    // Delete from DB
    await propertyImagesRepository.delete(imageId);
    return true;
  },
};

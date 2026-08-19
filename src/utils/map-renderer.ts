import sharp from "sharp";
import { promises as fs } from "node:fs";

export interface MapCoordinate {
    x: number;
    z: number;
    index?: number;
}

const MAX_IMAGE_DIMENSION = 400;
const MAX_CHUNK_RESOLUTION = 16;
const MIN_CHUNK_RESOLUTION = 2;

function computeGridLayout(coordinates: MapCoordinate[]) {
    const minX = Math.min(...coordinates.map((c) => c.x));
    const maxX = Math.max(...coordinates.map((c) => c.x));
    const minZ = Math.min(...coordinates.map((c) => c.z));
    const maxZ = Math.max(...coordinates.map((c) => c.z));

    const claimWidth = Math.abs(maxX - minX);
    const claimHeight = Math.abs(maxZ - minZ);
    const maxClaimDimension = Math.max(claimWidth, claimHeight) + 2;

    const chunkResolution = Math.floor(MAX_IMAGE_DIMENSION / maxClaimDimension);
    const chunkSize = Math.min(Math.max(chunkResolution, MIN_CHUNK_RESOLUTION), MAX_CHUNK_RESOLUTION);
    const margin = chunkSize;

    const townWidth = (maxX - minX + 1) * chunkSize;
    const townHeight = (maxZ - minZ + 1) * chunkSize;

    return {
        minX, maxX, minZ, maxZ, chunkSize, margin,
        canvasWidth: townWidth + 2 * margin,
        canvasHeight: townHeight + 2 * margin,
    };
}

export async function renderTownMap(id: string, coordinates: MapCoordinate[], home: { x: number; z: number }) {
    const { minX, maxX, minZ, maxZ, chunkSize, margin, canvasWidth, canvasHeight } = computeGridLayout(coordinates);
    const outputPath = `./output/${id}.png`;
    const background = Buffer.alloc(canvasWidth * canvasHeight * 4, 0);

    for (const { x, z } of coordinates) {
        const adjustedX = (x - minX) * chunkSize + margin;
        const adjustedZ = (z - minZ) * chunkSize + margin;
        const isHome = x === home.x && z === home.z;

        for (let i = 0; i < chunkSize; i++) {
            for (let j = 0; j < chunkSize; j++) {
                const index = ((adjustedZ + j) * canvasWidth + (adjustedX + i)) * 4;
                if (isHome) {
                    background[index] = 255;
                    background[index + 1] = 255;
                    background[index + 2] = 0;
                } else {
                    background[index] = 80;
                    background[index + 1] = 145;
                    background[index + 2] = 190;
                }
                background[index + 3] = 255;
            }
        }
    }

    const mapBuffer = await sharp(background, { raw: { width: canvasWidth, height: canvasHeight, channels: 4 } })
        .toFormat("png")
        .toBuffer();

    const worldBackgroundBuffer = await cropWorldImage((minX - 1) * 16, (minZ - 1) * 16, (maxX + 1) * 16, (maxZ + 1) * 16);
    const worldBackground = sharp(worldBackgroundBuffer).resize({ width: canvasWidth, height: canvasHeight, fit: sharp.fit.cover });

    await worldBackground
        .composite([{ input: mapBuffer }])
        .toFile(outputPath)
        .catch((err) => console.error("Error while drawing town map:", err));
}

export async function renderNationMap(id: string, coordinates: MapCoordinate[]) {
    const { minX, maxX, minZ, maxZ, chunkSize, margin, canvasWidth, canvasHeight } = computeGridLayout(coordinates);
    const outputPath = `./output/${id}.png`;
    const background = Buffer.alloc(canvasWidth * canvasHeight * 4, 0);

    for (const { x, z, index = 0 } of coordinates) {
        const adjustedX = (x - minX) * chunkSize + margin;
        const adjustedZ = (z - minZ) * chunkSize + margin;

        for (let i = 0; i < chunkSize; i++) {
            for (let j = 0; j < chunkSize; j++) {
                const pindex = ((adjustedZ + j) * canvasWidth + (adjustedX + i)) * 4;
                background[pindex] = Math.min(80 + (index % 12) * 10, 255);
                background[pindex + 1] = Math.min(145 + (index % 12) * 10, 255);
                background[pindex + 2] = Math.min(190 + (index % 12) * 10, 255);
                background[pindex + 3] = 255;
            }
        }
    }

    const mapBuffer = await sharp(background, { raw: { width: canvasWidth, height: canvasHeight, channels: 4 } })
        .toFormat("png")
        .toBuffer();

    const worldBackgroundBuffer = await cropWorldImage((minX - 1) * 16, (minZ - 1) * 16, (maxX + 1) * 16, (maxZ + 1) * 16);
    const worldBackground = sharp(worldBackgroundBuffer).resize({ width: canvasWidth, height: canvasHeight, fit: sharp.fit.cover });

    await worldBackground
        .composite([{ input: mapBuffer }])
        .toFile(outputPath)
        .catch((err) => console.error("Error while drawing nation map:", err));
}

async function cropWorldImage(x1: number, y1: number, x2: number, y2: number) {
    const xRange = 36800;
    const yRange = 18400;
    const imageWidth = 1920;
    const imageHeight = 961;

    const projectedX1 = ((x1 + xRange) / (2 * xRange)) * imageWidth;
    const projectedY1 = ((y1 + yRange) / (2 * yRange)) * imageHeight;
    const projectedX2 = ((x2 + xRange) / (2 * xRange)) * imageWidth;
    const projectedY2 = ((y2 + yRange) / (2 * yRange)) * imageHeight;

    const cropWidth = Math.abs(projectedX2 - projectedX1);
    const cropHeight = Math.abs(projectedY1 - projectedY2);

    return sharp("./input/world.png")
        .extract({
            left: Math.floor(projectedX1),
            top: Math.floor(projectedY1),
            width: Math.ceil(cropWidth),
            height: Math.ceil(cropHeight),
        })
        .toBuffer();
}

export async function cleanupMapFile(id: string) {
    await fs.unlink(`./output/${id}.png`).catch((err) => console.error("Error deleting map file:", err));
}
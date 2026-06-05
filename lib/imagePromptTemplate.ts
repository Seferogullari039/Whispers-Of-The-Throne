export const IMAGE_STYLE_TEMPLATE = `
Stylized 2D dark fantasy card illustration, painterly vector style, simplified shapes, friendly dark fantasy mood, warm readable colors, mobile card game artwork, Reigns inspired composition, portrait 9:16 illustration, elegant silhouettes, no photorealism, no realism, no 3D render, no text, no logo, no watermark.
`.trim();

export function buildImagePrompt(sceneDescription: string): string {
  const scene = sceneDescription.trim();
  if (!scene) return IMAGE_STYLE_TEMPLATE;
  return `${IMAGE_STYLE_TEMPLATE} ${scene}`;
}

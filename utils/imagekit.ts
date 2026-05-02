import { encode } from "js-base64";

export async function uploadToImageKit(
  base64Image: string,
  fileName: string,
): Promise<string> {
  const privateKey = process.env.EXPO_PUBLIC_IMAGEKIT_PRIVATE_KEY;
  if (!privateKey)
    throw new Error("ImageKit private key is not set in environment variables");

  const authHeader = "Basic " + encode(privateKey + ":");

  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("fileName", fileName);
  formData.append("useUniqueFileName", "true");

  try {
    const response = await fetch(
      "https://upload.imagekit.io/api/v1/files/upload",
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ImageKit upload failed: ", errorText);
      throw new Error(
        `Image upload failed with status ${response.status} - ${response.statusText}`,
      );
    }
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error uploading image to ImageKit: ", error);
    throw error;
  }
}

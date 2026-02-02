
import { GoogleGenAI } from "@google/genai";

export class GeminiVideoService {
  private static instance: GeminiVideoService;
  
  private constructor() {}

  static getInstance(): GeminiVideoService {
    if (!GeminiVideoService.instance) {
      GeminiVideoService.instance = new GeminiVideoService();
    }
    return GeminiVideoService.instance;
  }

  async generateCinematicAnimation(
    imageBase64: string, 
    onStatusUpdate: (msg: string) => void
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Cinematic realistic animation from this image. Long flowing white hair moving gently in cold mountain wind, smooth and natural flow. Wavy hair strands following the wind direction. Facial expression and features remain unchanged. Fine snow, light dust, and atmospheric particles floating dynamically with depth of field. Red ribbons and fabric fluttering softly. Static camera with very subtle slow push-in. Epic fantasy style, high detail, soft cold lighting, serene yet powerful atmosphere, smooth motion, no distortion.`;

    onStatusUpdate("Initializing video generation engine...");
    
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
          imageBytes: imageBase64,
          mimeType: 'image/png',
        },
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      onStatusUpdate("Crafting visual physics and hair dynamics...");
      
      const loadingMessages = [
        "Simulating mountain wind patterns...",
        "Rendering atmospheric particle depth...",
        "Polishing hair strand animations...",
        "Applying cinematic lighting passes...",
        "Finalizing realistic motion vectors...",
        "Almost ready for your vision..."
      ];
      
      let messageIndex = 0;
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Cycle through status messages to keep user engaged
        onStatusUpdate(loadingMessages[messageIndex % loadingMessages.length]);
        messageIndex++;
        
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("Failed to retrieve generated video URL.");
      }

      onStatusUpdate("Downloading final high-fidelity export...");
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) {
        throw new Error("Failed to fetch the video data.");
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
      
    } catch (error: any) {
      console.error("Video Generation Error:", error);
      if (error.message?.includes("Requested entity was not found")) {
        throw new Error("API_KEY_RESET");
      }
      throw error;
    }
  }
}

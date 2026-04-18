import * as FileSystem from 'expo-file-system';

const AZURE_SPEECH_KEY = process.env.EXPO_PUBLIC_AZURE_SPEECH_KEY || '';
const AZURE_REGION = process.env.EXPO_PUBLIC_AZURE_REGION || '';

export const transcribeAudioWithAzure = async (uri: string): Promise<string> => {
  try {
    if (!AZURE_SPEECH_KEY) {
      console.warn("Missing Azure Speech Key! Simulating response for testing.");
      await new Promise(resolve => setTimeout(resolve, 1500));
      return "simulate success";
    }

    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error("Audio file not found at " + uri);
    }

    console.log("File Info details:", fileInfo);

    const apiUrl = `https://${AZURE_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
    const isOgg = uri.endsWith('.ogg');
    const contentType = isOgg
      ? 'audio/ogg; codecs=opus'
      : 'audio/wav; codecs="audio/pcm"; samplerate=16000';

    const uploadResponse = await FileSystem.uploadAsync(apiUrl, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'Content-Type': contentType,
        'Accept': 'application/json'
      }
    });

    if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
      throw new Error(`Azure HTTP ${uploadResponse.status}: ${uploadResponse.body}`);
    }

    const result = JSON.parse(uploadResponse.body);
    console.log("Azure Raw Response:", result);
    return result.DisplayText || '';

  } catch (error) {
    console.error('Transcription Error:', error);
    throw error;
  }
};

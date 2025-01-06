const AWS = require('aws-sdk');
const { OpenAI } = require('openai');
const config = require('../config/config');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region
});

// Configure OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

class VoiceService {
  // Upload audio file to S3
  async uploadToS3(file) {
    const key = `voice-memos/${uuidv4()}${path.extname(file.originalname)}`;
    
    const params = {
      Bucket: config.aws.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    try {
      const result = await s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload voice memo');
    }
  }

  // Transcribe audio using OpenAI's Whisper
  async transcribeAudio(file) {
    try {
      // Save buffer to temporary file
      const tempFilePath = path.join('/tmp', `${uuidv4()}.wav`);
      await fs.writeFile(tempFilePath, file.buffer);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
        language: "en"
      });

      // Clean up temp file
      await fs.unlink(tempFilePath);

      return transcription.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe voice memo');
    }
  }

  // Process voice memo (upload and transcribe)
  async processVoiceMemo(file) {
    try {
      // Upload to S3 and get transcription in parallel
      const [voiceUrl, transcription] = await Promise.all([
        this.uploadToS3(file),
        this.transcribeAudio(file)
      ]);

      return {
        voiceUrl,
        transcription
      };
    } catch (error) {
      console.error('Voice processing error:', error);
      throw new Error('Failed to process voice memo');
    }
  }

  // Generate a pre-signed URL for direct browser upload
  async getPresignedUrl(fileName, fileType) {
    const key = `voice-memos/${uuidv4()}${path.extname(fileName)}`;
    
    const params = {
      Bucket: config.aws.bucketName,
      Key: key,
      ContentType: fileType,
      Expires: 300 // URL expires in 5 minutes
    };

    try {
      const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
      return {
        url: presignedUrl,
        key: key
      };
    } catch (error) {
      console.error('Presigned URL generation error:', error);
      throw new Error('Failed to generate upload URL');
    }
  }
}

module.exports = new VoiceService(); 
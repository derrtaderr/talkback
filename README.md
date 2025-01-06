# TalkBack - Voice-Powered Diary App

TalkBack is a mobile application that allows users to create voice and text diary entries, and uniquely chat with their past selves using AI-powered insights.

## Features

- Voice and text journal entries
- AI-powered chat with past entries
- Mood and topic tagging
- Automated insights and patterns
- Secure and private data storage

## Tech Stack

- **Frontend**: React Native
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Storage**: AWS S3 (for voice recordings)
- **AI/ML**: OpenAI API for chat features, Whisper for speech-to-text

## Project Structure

```
talkback/
├── backend/         # Node.js/Express backend
├── mobile/         # React Native mobile app
└── docs/           # Documentation and PRD
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- React Native development environment
- MongoDB

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

### Mobile Setup
1. Navigate to the mobile directory:
   ```bash
   cd mobile
   npm install
   npx react-native run-ios    # For iOS
   npx react-native run-android # For Android
   ```

## Environment Variables
Create `.env` files in both backend and mobile directories. Examples are provided in `.env.example` files.

## License
MIT 
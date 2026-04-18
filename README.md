# ✨ Speak & Learn App

A full-stack, visually engaging, kid-friendly React Native application that helps children learn to read and pronounce words accurately! 

This app records a child's speech, automatically processes the audio using Microsoft Azure's Cognitive Speech-to-Text AI, and runs it against a Python Django backend powered by Google's Gemini AI to provide specialized, hyper-tailored phonetic feedback when the child makes a mistake.

## 🚀 Features
* **Beautiful, Playful UI**: Kid-friendly design utilizing bouncy animations, floating background aesthetics, and soft pastel dynamically-colored feedback bubbles. 
* **Native Audio Processing**: Uses native Android/iOS recording APIs mapped precisely to 16-bit PCM (and Ogg Opus for Android) to provide studio-level audio accuracy.
* **Azure AI Speech-To-Text**: Sends raw binary audio to Microsoft Azure for instantaneous, high-fidelity transcription.
* **Intelligent Gemini Backend**: Analyzes mispronunciations contextually! Instead of just saying "Wrong", the custom Django backend uses Gemini (Flash) to give pinpoint teaching advice (e.g., *"Make sure to sound out the 'ah' in Apple!"*).

## 🗂️ Project Structure

If you're setting up the project, it currently consists of two parts:
1. `/learning-app` - The React Native (Expo) frontend application.
2. `/backend` - The Django backend powering the evaluation API. (Currently found in `devora-test-be`).

---

## 🛠️ Tech Stack

**Frontend (Client)**
* React Native (Expo)
* React Native Reanimated (for beautiful 60fps micro-animations)
* Expo AV & FileSystem (for native mic recording and stream uploading)

**Backend (Server)**
* Django / Django REST Framework
* Google Generative AI SDK (`gemini-1.5-flash`)
* Supabase Auth (for tracking user logins and session states)

**External AI APIs**
* Microsoft Azure STT (Speech-To-Text REST endpoints)
* Google Gemini (Smart pronunciation coaching) 

## 🔌 Getting Started

### 1. Start the Frontend
First, navigate to the Expo directory and install dependencies:
```bash
cd learning-app
npm install

# Start the Expo development server
npx expo start
```

### 2. Start the Backend
Navigate to your Python Django application, install the dependencies, and boot the endpoint:
```bash
# Go to you backend directory
pip install -r requirements.txt

# Start the local server
python manage.py runserver
```

*(Note: Don't forget to configure your `.env` variables for Expo, Azure, and Gemini for both environments!)*

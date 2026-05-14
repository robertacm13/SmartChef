# SmartChef - Advanced AI Food Analysis Platform

![Version](https://img.shields.io/badge/version-2.1.0-orange)
![Python](https://img.shields.io/badge/python-3.13-blue)
![React](https://img.shields.io/badge/react-19.0-61dafb)
![FastAPI](https://img.shields.io/badge/fastapi-0.118-009688)
![Ollama](https://img.shields.io/badge/AI-Ollama-lightgrey)

## Overview

SmartChef is an advanced food analysis and health tracking platform that leverages deep learning for food recognition and automated nutritional calculation. It integrates local AI models to provide personalized meal suggestions, creative recipes, and advanced visual analysis. The system features a professional dashboard with interactive data visualization, PDF reporting, automated health tracking, and secure multi-factor authentication.

## Core Features

### AI Recognition & Analysis
* **Deep Learning Food Recognition**: Automated identification of food dishes using a PyTorch EfficientNet-B5 model.
* **Ingredient Mapping**: Intelligent mapping of detected dishes to their constituent ingredients for nutritional analysis.
* **Nutritional Breakdown**: Real-time calculation of calories, protein, carbohydrates, fats, and fiber based on ingredient profiles.
* **Enhanced Visual Intelligence**: Advanced ingredient detection using the Moondream vision model via Ollama for detailed visual analysis.


### Health & Progress Tracking
* **Dynamic Goal Setting**: Personalized nutritional targets based on BMR and TDEE calculations.
* **Weight Management**: Comprehensive history tracking with progress visualization.
* **Hydration Tracking**: Daily water intake monitoring.
* **Engagement Streaks**: Visual tracking of consistent usage and health habits.

### Security & User Experience
* **Advanced Authentication**: Secure login system with JWT, bcrypt, and TOTP-based 2FA.
* **Professional Dashboard**: Interactive charts (Pie and Bar) for nutritional distribution.
* **History Management**: Advanced searching, sorting, and favoriting of past analyses.
* **Document Export**: Generation of professional PDF nutritional reports.
* **Notifications**: Integrated in-app and email alert system.

### Local AI Capabilities (Ollama)
* **Personalized Meal Suggestions**: AI-driven recommendations based on daily remaining nutritional targets.
* **Creative Recipe Generation**: Intelligent recipe suggestions based on available ingredients.
* **Intelligent Restaurant Search**: Automated Google Maps query generation tailored to nutritional needs.
* **Micronutrient Insights**: Smart advice on potential vitamin and mineral gaps.

## Tech Stack

### Backend
* **Framework**: FastAPI
* **ML Engine**: PyTorch, TorchVision, Timm
* **Local AI**: Ollama (qwen2.5-coder:1.5b, moondream)
* **Database**: MongoDB Atlas
* **Security**: PyOTP (2FA), JWT, Bcrypt
* **Task Scheduling**: APScheduler

### Frontend
* **Framework**: React 19
* **Visualization**: Chart.js, React-Chartjs-2
* **Reporting**: jsPDF, jspdf-autotable
* **Typography**: Poppins (Google Fonts)

## Installation & Setup

### 1. Prerequisites
* Python 3.13+
* Node.js & npm
* MongoDB Atlas account
* Ollama installed locally

### 2. Ollama Configuration
Install Ollama and pull the required models:
```bash
ollama pull qwen2.5-coder:1.5b
ollama pull moondream
```
Ensure the Ollama service is running on `http://localhost:11434`.

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
pip install -r requirements.txt
```

#### Environment Variables (.env)
```env
MONGO_URI=your_mongodb_atlas_uri
SECRET_KEY=your_jwt_secret_key
MODEL_THRESHOLD=0.3
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py            # API entry and core routing
│   │   ├── auth.py            # Authentication and 2FA logic
│   │   ├── ollama_client.py   # Local AI model integration
│   │   ├── database.py        # MongoDB connection and schemas
│   │   ├── model.py           # PyTorch model initialization
│   │   ├── nutrition.py       # Ingredient-to-nutrition mapping
│   │   ├── email_service.py   # Automated notification system
│   │   └── scheduler.py       # Background tasks and reminders
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Dashboard, History, Tracking components
│   │   ├── App.js             # Routing and global state
│   │   └── App.css            # Design system and themes
│   └── package.json
└── README.md
```

## Performance & Constraints
* **Upload Limit**: 5MB per image.
* **Formats**: JPG, PNG, WEBP.
* **Response Time**: Analysis typically completed in under 2 seconds.
* **Storage**: LocalStorage utilized for theme and session persistence.

## License
Proprietary. All rights reserved.
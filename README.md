# SmartChef - Advanced AI Food Analysis Platform

![Version](https://img.shields.io/badge/version-2.0.0-orange)
![Python](https://img.shields.io/badge/python-3.13-blue)
![React](https://img.shields.io/badge/react-19.0-61dafb)
![FastAPI](https://img.shields.io/badge/fastapi-0.118-009688)

## Overview

SmartChef is an advanced food analysis platform using deep learning to recognize ingredients from images and calculate nutritional values. It features a professional dashboard with interactive charts, PDF reporting, and secure 2FA authentication.

## Tech Stack

### Backend

- **Framework:** FastAPI 0.118.0
- **Language:** Python 3.13
- **ML Engine:** PyTorch 2.5.1 + TorchVision 0.20.1
- **Database:** MongoDB Atlas
- **Security:** pyotp (TOTP 2FA), JWT, bcrypt, passlib
- **Server:** Uvicorn (ASGI)

### Frontend

- **Framework:** React 19.0.0
- **Charts:** Chart.js 4.4.7 + react-chartjs-2 5.3.0
- **PDF Export:** jsPDF 2.5.2 + jspdf-autotable 3.8.4
- **Styling:** Custom CSS with Poppins typography
- **State Management:** React Hooks

## Installation

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
```

#### Environment Variables (.env)

```
MONGO_URI=your_mongodb_atlas_uri
SECRET_KEY=your_jwt_secret_key
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Key Features

- **AI Recognition:** Deep learning model for automated ingredient detection.
- **Nutrition Dashboard:** Real-time calculation of calories, protein, carbs, fats, and fiber.
- **Data Visualization:** Interactive Pie and Bar charts for nutritional distribution.
- **Advanced History:** Sorting, searching, and filtering of past food analyses.
- **PDF Export:** Generation of professional nutritional reports.
- **Accessibility:** Full Dark Mode support and responsive design (mobile-ready).

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application entry and routes
│   │   ├── auth.py          # 2FA and JWT logic
│   │   ├── database.py      # MongoDB connection and schemas
│   │   ├── model.py         # PyTorch model initialization
│   │   └── nutrition.py     # Ingredient-to-nutrition mapping
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Dashboard, History, Login, Register
│   │   ├── App.js           # Main application routing and state
│   │   └── App.css          # Design system and animations
│   └── package.json
└── README.md
```

## Performance & Limitations

- **File Limits:** Maximum image upload size: 5MB.
- **Supported Formats:** JPG, PNG, WEBP.
- **Processing Time:** Analysis typically completed in < 2 seconds.
- **Caching:** Theme preferences and session data stored in LocalStorage.

## License

Proprietary. All rights reserved.
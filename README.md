# 🍳 SmartChef - Advanced AI Food Analysis Platform

![Version](https://img.shields.io/badge/version-2.0.0-orange)
![Python](https://img.shields.io/badge/python-3.13-blue)
![React](https://img.shields.io/badge/react-19.0-61dafb)
![FastAPI](https://img.shields.io/badge/fastapi-0.118-009688)
![License](https://img.shields.io/badge/license-proprietary-red)

## 🌟 Overview

**SmartChef** este o platformă AI avansată de analiză alimentară care folosește deep learning pentru a recunoaște ingredientele din imagini și a calcula automat valorile nutriționale. Cu funcționalități premium precum export PDF, grafice interactive, dark mode și sistem de favorite, SmartChef oferă o experiență completă pentru monitorizarea nutriției.

### ✨ Key Features

#### 🔥 Core Features (v1.0)
- 🔐 **Autentificare Securizată** - 2FA cu Google Authenticator
- 📸 **Recunoaștere AI** - Detectarea automată a ingredientelor
- 🥗 **Calcul Nutrițional** - Calorii, proteine, carbohidrați, grăsimi, fibre
- 📜 **Istoric Complet** - Toate analizele salvate în cloud
- 🗑️ **Delete Functionality** - Șterge analize cu confirmare
- 💊 **Nutrition per Ingredient** - Modal detaliat pentru fiecare ingredient

#### 🚀 Advanced Features (v2.0)
1. **📥 Export PDF Profesional** - Rapoarte complete descărcabile
2. **📊 Grafice Interactive** - Pie & Bar charts cu Chart.js
3. **🔍 Căutare și Filtre** - Search, filtrare, sortare avansată
4. **📈 Dashboard Statistici** - Analytics complet cu heatmap
5. **🌙 Dark Mode** - Temă întunecată cu persistență
6. **⭐ Sistem Favorite** - Marchează analizele preferate
7. **📱 Responsive Design** - Optimizat pentru mobile (375px+)
8. **✨ Animații Premium** - 15+ animații și skeleton loaders

---

## 📸 Screenshots

### Light Mode - Main Page
![Main Page](https://via.placeholder.com/800x400/ffecd1/ff6b35?text=SmartChef+Main+Page)

### Dark Mode - Dashboard
![Dashboard](https://via.placeholder.com/800x400/1a1a2e/ff8c42?text=Dashboard+Dark+Mode)

### Mobile Responsive
![Mobile](https://via.placeholder.com/400x800/ffecd1/ff6b35?text=Mobile+View)

---

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI 0.118.0
- **Language:** Python 3.13
- **ML Library:** PyTorch 2.5.1 + TorchVision 0.20.1
- **Database:** MongoDB Atlas
- **Auth:** pyotp (TOTP 2FA), bcrypt, passlib
- **Server:** Uvicorn (ASGI)

### Frontend
- **Framework:** React 19.0.0
- **Charts:** Chart.js 4.4.7 + react-chartjs-2 5.3.0
- **PDF Export:** jsPDF 2.5.2 + jspdf-autotable 3.8.4
- **Styling:** Custom CSS with Poppins font
- **State Management:** React Hooks

### Infrastructure
- **Database:** MongoDB Atlas (Cloud)
- **Storage:** Base64 image encoding in MongoDB
- **Authentication:** Token-based with 2FA

---

## 📦 Installation

### Prerequisites
- Python 3.13+
- Node.js 18+
- MongoDB Atlas account
- Git

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/smartchef.git
cd smartchef
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo MONGO_URI=your_mongodb_atlas_uri > .env

# Run server
uvicorn app.main:app --reload --port 8001
```

Backend will run on: `http://localhost:8001`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on: `http://localhost:3000`

---

## 🚀 Quick Start

### 1. Register Account
- Navigate to `http://localhost:3000`
- Click "Register"
- Enter email and password
- Scan QR code with Google Authenticator
- Save TOTP secret

### 2. Login
- Click "Login"
- Enter credentials
- Enter 6-digit TOTP code from authenticator

### 3. Analyze Food
- Click "📸 Încarcă o imagine"
- Select food image from device
- Click "🔍 Analizează Alimentul"
- View results (ingredients + nutrition)

### 4. Export PDF
- After analysis, click "📥 Exportă PDF"
- PDF downloads automatically

### 5. View Dashboard
- Click "📈 Dashboard" in navbar
- See statistics, charts, and heatmap
- Toggle between 7 and 30 days

### 6. Manage History
- Click "📊 Istoric"
- Search by filename or ingredient
- Filter by ingredient count
- Sort by date/calories
- Mark favorites with ⭐
- Delete analyses with 🗑️

### 7. Toggle Dark Mode
- Click 🌙 button in navbar
- Entire app switches to dark theme
- Preference saved in localStorage

---

## 📖 Documentation

### API Endpoints

#### Authentication
```http
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: {
  "status": "success",
  "totp_secret": "BASE32SECRET",
  "qr_code": "data:image/png;base64,..."
}
```

```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "totp_code": "123456"
}

Response: {
  "status": "success",
  "message": "Login successful"
}
```

#### Food Analysis
```http
POST /analyze_food/
Headers:
  X-User-Email: user@example.com
Body: multipart/form-data
  file: <image_file>

Response: {
  "status": "success",
  "ingredients": ["banana", "apple", "yogurt"],
  "nutrition": {
    "total_nutrition": {
      "calories": 350.5,
      "protein": 12.3,
      "carbs": 45.2,
      "fat": 8.7,
      "fiber": 6.1
    },
    "individual_nutrition": { ... }
  }
}
```

```http
GET /analysis_history/{user_email}

Response: {
  "status": "success",
  "analyses": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user_email": "user@example.com",
      "image_name": "food.jpg",
      "ingredients": [...],
      "nutrition": {...},
      "is_favorite": false,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

```http
PUT /analysis/{analysis_id}/favorite
Headers:
  X-User-Email: user@example.com

Response: {
  "status": "success",
  "is_favorite": true
}
```

```http
DELETE /analysis/{analysis_id}
Headers:
  X-User-Email: user@example.com

Response: {
  "status": "success",
  "message": "Analysis deleted successfully"
}
```

### Component Structure

```
frontend/src/
├── App.js              # Main application component
├── App.css             # Global styles + responsive + animations
├── Dashboard.js        # Statistics and analytics dashboard
├── History.js          # Analysis history with filters
├── Login.js            # Login page with 2FA
├── Register.js         # Registration page
├── index.js            # React entry point
└── ...

backend/app/
├── main.py             # FastAPI routes
├── auth.py             # Authentication logic
├── model.py            # ML model loading
├── nutrition.py        # Nutrition calculations
├── database.py         # MongoDB connection
└── ...
```

---

## 🎨 Design System

### Color Palette

**Light Mode:**
- Primary: `#ff6b35` (Orange)
- Secondary: `#ff8c42` (Light Orange)
- Background: `#ffecd1` (Cream)
- Cards: `#ffffff` (White)
- Text: `#333333` (Dark Gray)

**Dark Mode:**
- Primary: `#ff8c42`
- Background: `linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)`
- Cards: `linear-gradient(145deg, #2d2d44, #252540)`
- Text: `#e0e0e0` (Light Gray)

### Typography
- **Font:** Poppins (Google Fonts)
- **Weights:** 300, 400, 500, 600, 700
- **Base Size:** 16px (1rem)

### Spacing
- **xs:** 0.25rem (4px)
- **sm:** 0.5rem (8px)
- **md:** 1rem (16px)
- **lg:** 2rem (32px)
- **xl:** 3rem (48px)

---

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
pytest tests/

# Frontend tests
cd frontend
npm test
```

### Manual Testing Checklist
See [TESTING.md](./TESTING.md) for comprehensive testing guide.

**Quick Test:**
1. ✅ Register → Login → Upload → Analyze
2. ✅ Export PDF → Open in viewer
3. ✅ Toggle Dark Mode → Verify all pages
4. ✅ Mark Favorite → Filter favorites
5. ✅ Mobile view (375px) → All features work

---

## 📊 Performance

### Metrics
- **First Load:** < 3 seconds
- **Page Transition:** < 300ms
- **Search Filter:** < 100ms (instant)
- **Chart Render:** < 1 second
- **PDF Generation:** < 2 seconds
- **Theme Switch:** < 500ms

### Optimization
- Lazy loading for charts
- Efficient MongoDB queries
- localStorage caching
- CSS animations with `will-change`
- React.memo for heavy components

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **ML Model:** Uses 22 hardcoded ingredients (placeholder)
2. **PDF Export:** Charts not included (only tables)
3. **Image Size:** Limited to 5MB uploads
4. **Browser:** Best experience on Chrome/Firefox (latest)

### Planned Fixes (v2.1)
- Train custom PyTorch model for 100+ ingredients
- Add charts to PDF export
- Increase upload limit to 10MB
- Safari performance optimizations

---

## 🔮 Roadmap

### Version 2.1 (Q2 2024)
- [ ] Comparație între 2 analize
- [ ] Notițe personale pentru fiecare analiză
- [ ] Export charts în PDF
- [ ] Notificări push

### Version 3.0 (Q3 2024)
- [ ] Mobile app (React Native)
- [ ] API publică pentru dezvoltatori
- [ ] Integrări cu MyFitnessPal, Apple Health
- [ ] Recomandări AI personalizate
- [ ] Social features (share, profiles)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Style
- **Python:** Follow PEP 8
- **JavaScript:** ESLint + Prettier
- **CSS:** BEM naming convention
- **Commits:** Conventional Commits format

---

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

### Latest (v2.0.0)
- ✅ Export PDF profesional
- ✅ Grafice interactive Chart.js
- ✅ Căutare și filtre avansate
- ✅ Dashboard cu statistici
- ✅ Dark mode toggle
- ✅ Sistem de favorite
- ✅ Responsive mobile design
- ✅ Animații și tranziții

---

## 📄 License

This project is proprietary software. All rights reserved.

**© 2024 SmartChef Team**

---

## 👥 Team

- **Lead Developer:** SmartChef Team
- **UI/UX Designer:** SmartChef Team
- **QA Engineer:** SmartChef Team

---

## 📞 Support

### Contact
- **Email:** support@smartchef.ro
- **GitHub Issues:** [Create Issue](https://github.com/yourusername/smartchef/issues)
- **Documentation:** [Wiki](https://github.com/yourusername/smartchef/wiki)

### FAQ

**Q: Pot folosi SmartChef offline?**  
A: Nu, aplicația necesită conexiune la internet pentru analiză și salvare în cloud.

**Q: Ce formate de imagini sunt suportate?**  
A: JPG, PNG, JPEG, WebP (max 5MB)

**Q: Cum resetez parola?**  
A: În curând va fi disponibilă funcționalitatea de reset parolă.

**Q: Aplicația e gratuită?**  
A: Da, SmartChef v2.0 este complet gratuit.

**Q: Cum pot exporta toate analizele?**  
A: În Dashboard, vei găsi în curând opțiunea de export bulk.

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [React](https://react.dev/) - UI library
- [Chart.js](https://www.chartjs.org/) - Beautiful charts
- [MongoDB](https://www.mongodb.com/) - Database platform
- [PyTorch](https://pytorch.org/) - ML framework
- [Google Fonts](https://fonts.google.com/) - Poppins typography

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/smartchef&type=Date)](https://star-history.com/#yourusername/smartchef&Date)

---

<div align="center">

**Made with ❤️ by SmartChef Team**

[Website](https://smartchef.ro) • [Documentation](./FEATURES.md) • [Changelog](./CHANGELOG.md) • [Testing Guide](./TESTING.md)

</div>

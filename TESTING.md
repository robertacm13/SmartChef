# 🧪 SmartChef - Testing Guide

## 📋 Checklist Testare Complete

### ✅ 1. Export PDF
**Pași:**
1. Autentifică-te în aplicație
2. Uploadează o imagine cu mâncare
3. Așteaptă rezultatele analizei
4. Click pe "📥 Exportă PDF"
5. Verifică dacă PDF-ul se descarcă
6. Deschide PDF-ul și verifică:
   - [ ] Header cu logo și titlu
   - [ ] Tabel cu ingrediente
   - [ ] Tabel cu valori nutriționale
   - [ ] Footer cu data și pagina

**Expected Result:** PDF complet, formatat profesional

---

### ✅ 2. Grafice Interactive
**Pași:**
1. După analiză, scroll down către secțiunea grafice
2. Verifică Pie Chart (macronutrienți):
   - [ ] Se afișează 3 sectoare (Proteine, Carbohidrați, Grăsimi)
   - [ ] Culorile sunt distincte (verde, albastru, galben)
   - [ ] Hover pe sectoare afișează valori
3. Verifică Bar Chart (calorii pe ingredient):
   - [ ] Bare pentru fiecare ingredient
   - [ ] Hover afișează exact numărul de calorii
   - [ ] Gradienți portocalii

**Expected Result:** Grafice interactive, responsive, cu date corecte

---

### ✅ 3. Căutare și Filtre
**Pași:**
1. Mergi la pagina "📊 Istoric"
2. Testează Search:
   - [ ] Scrie "food" → vezi doar analize cu "food" în nume
   - [ ] Scrie un ingredient (ex: "banana") → vezi analize cu acel ingredient
   - [ ] Șterge textul → vezi toate analizele
3. Testează Filtre:
   - [ ] Selectează "1-3 ingrediente" → vezi doar analizele cu 1-3 ingrediente
   - [ ] Selectează "4-6 ingrediente"
   - [ ] Selectează "7+ ingrediente"
4. Testează Sortare:
   - [ ] "Dată (Cele mai recente)" → prima analiză e cea mai nouă
   - [ ] "Dată (Cele mai vechi)" → prima analiză e cea mai veche
   - [ ] "Calorii (Descrescător)" → prima are cele mai multe calorii
   - [ ] "Calorii (Crescător)" → prima are cele mai puține calorii
5. Combină filtrele:
   - [ ] Search + Filtrare + Sortare funcționează simultan
   - [ ] Counter afișează numărul corect de rezultate

**Expected Result:** Filtrare și sortare instantanee, fără reload

---

### ✅ 4. Dashboard Statistici
**Pași:**
1. Click pe "📈 Dashboard" din navbar
2. Verifică Stat Cards:
   - [ ] "Total Analize" - număr corect
   - [ ] "Total Calorii" - sumă corectă
   - [ ] "Media Caloriilor" - calcul corect
   - [ ] "Top Ingrediente" - cele mai frecvente 5
3. Verifică Line Chart:
   - [ ] Afișează evoluția caloriilor pe zile
   - [ ] Hover pe puncte afișează data și calorii
4. Verifică Bar Chart:
   - [ ] Top 5 ingrediente după frecvență
   - [ ] Bare colorate gradient
5. Testează Toggle 7/30 zile:
   - [ ] Click "30 zile" → graficele se actualizează
   - [ ] Click "7 zile" → revin la interval scurt
6. Verifică Activity Heatmap:
   - [ ] Pătrate colorate după intensitate
   - [ ] Hover afișează data și număr analize
   - [ ] Culori: gri (0), light blue (1-2), purple (3-4), orange (5+)

**Expected Result:** Dashboard complet funcțional cu date în timp real

---

### ✅ 5. Dark Mode
**Pași:**
1. Click pe butonul 🌙 din navbar
2. Verifică schimbări:
   - [ ] Background devine gradient închis (albastru-violet)
   - [ ] Cards devin gri închis cu gradient
   - [ ] Text devine gri deschis (#e0e0e0)
   - [ ] Inputs au border și background adaptat
   - [ ] Grafice rămân vizibile și lizibile
   - [ ] Modals sunt dark mode
   - [ ] Ingredient badges adaptate
3. Click pe ☀️ pentru a reveni la Light Mode
4. Refresh pagina:
   - [ ] Tema rămâne cum ai setat-o (localStorage)
5. Navighează prin toate paginile în Dark Mode:
   - [ ] Main page
   - [ ] Dashboard
   - [ ] History
   - [ ] Login/Register
6. Verifică tranzițiile:
   - [ ] Schimbarea temei e smooth (0.4s)
   - [ ] Nu clipește sau sare

**Expected Result:** Dark mode complet pe toate componentele, persistență

---

### ✅ 6. Sistem Favorite
**Pași:**
1. Mergi la pagina "Istoric"
2. Click pe ⭐ lângă o analiză:
   - [ ] Steaua devine colorată (golden)
   - [ ] Se trimite request către backend
   - [ ] Status se salvează instant
3. Click din nou pe ⭐:
   - [ ] Steaua devine gri (unfavorite)
   - [ ] Status se actualizează în DB
4. Marchează 2-3 analize ca favorite
5. Click pe butonul "⭐ Favorite":
   - [ ] Butonul devine roz (activ)
   - [ ] Se afișează doar analizele favorite
   - [ ] Counter afișează numărul corect
6. Click din nou pentru a dezactiva filtrul:
   - [ ] Butonul devine alb
   - [ ] Toate analizele revin
7. Refresh pagina:
   - [ ] Analizele marcate ca favorite păstrează steaua colorată

**Expected Result:** Toggle favorite funcțional, persistență în MongoDB

---

### ✅ 7. Responsive Mobile
**Pași:**
1. Deschide DevTools (F12) → Device Toolbar (Ctrl+Shift+M)
2. Testează pe **iPhone SE (375px)**:
   - [ ] Navbar e stacked vertical
   - [ ] Logo centrat
   - [ ] Buttons touch-friendly
   - [ ] Cards full-width
   - [ ] Text sizes mai mici
   - [ ] Forms responsive
   - [ ] Grafice se încadrează
3. Testează pe **iPad (768px)**:
   - [ ] Layout intermediate
   - [ ] Navbar pe 2 rânduri
   - [ ] Cards puțin mai mari
4. Testează pe **Desktop (1920px)**:
   - [ ] Layout complet
   - [ ] Navbar orizontală
   - [ ] Max-width 1200px pe conținut
5. Testează funcționalitatea pe mobile:
   - [ ] Upload imagine
   - [ ] Analiză
   - [ ] Scroll prin rezultate
   - [ ] Click pe ingredient badge → modal
   - [ ] Export PDF
   - [ ] Toggle dark mode
   - [ ] Toggle favorite
6. Testează landscape pe mobile:
   - [ ] Layout se adaptează corect

**Expected Result:** Aplicație fully responsive 375px - 1920px+

---

### ✅ 8. Animații și Tranziții
**Pași:**
1. **Fade-in animations:**
   - [ ] Reload pagina → cards fade in
   - [ ] Feature cards fade in cu delay secvențial
2. **Slide-up modals:**
   - [ ] Click pe ingredient → modal slide-up
   - [ ] Click pe delete → confirmation slide-up
3. **Skeleton loaders:**
   - [ ] Upload imagine și analizează
   - [ ] În timpul loading-ului vezi:
     - [ ] Spinner rotativ
     - [ ] Skeleton cards cu shimmer
     - [ ] Skeleton text lines
4. **Button animations:**
   - [ ] Hover pe buttons → pulse effect
   - [ ] Click → scale down (0.95)
5. **Logo bounce:**
   - [ ] Hover pe logo SmartChef → bounce up/down
6. **Ingredient badges:**
   - [ ] După analiză, badges fade in secvențial
   - [ ] Hover → scale și shadow
7. **Progress bars:**
   - [ ] Se animează width cu cubic-bezier
8. **Delete button:**
   - [ ] Hover → pulse și scale
9. **Theme transition:**
   - [ ] Toggle dark mode → smooth fade (0.4s)
10. **Page transitions:**
    - [ ] Navighează între pagini → fade-in smooth
11. **Timeline dots:**
    - [ ] În istoric, dots scale-in
12. **Stat cards:**
    - [ ] Dashboard load → cards fade in cu delay
    - [ ] Hover → translateY și scale

**Test cu prefers-reduced-motion:**
1. Windows Settings → Ease of Access → Display → Show animations → OFF
2. Refresh app:
   - [ ] Animațiile se reduc drastic (0.01ms)

**Expected Result:** 15+ animații smooth, accessibility-aware

---

## 🔍 Integration Testing

### Scenario 1: Utilizator Nou
1. [ ] Register cu email nou
2. [ ] Setup 2FA cu Google Authenticator
3. [ ] Login cu TOTP
4. [ ] Upload prima imagine
5. [ ] Analizează
6. [ ] Marchează ca favorită
7. [ ] Export PDF
8. [ ] Mergi la Dashboard → vezi 1 analiză
9. [ ] Toggle dark mode
10. [ ] Logout

### Scenario 2: Utilizator Existent
1. [ ] Login cu cont existent
2. [ ] Mergi la Istoric → vezi toate analizele
3. [ ] Search după ingredient
4. [ ] Filtrează după "4-6 ingrediente"
5. [ ] Sortează după "Calorii descrescător"
6. [ ] Marchează 3 analize ca favorite
7. [ ] Filtrează "Doar favorite"
8. [ ] Mergi la Dashboard
9. [ ] Toggle 30 zile
10. [ ] Șterge 1 analiză
11. [ ] Confirm ștergere
12. [ ] Refresh → analiză dispărută

### Scenario 3: Mobile User
1. [ ] Device: iPhone 12 (390px)
2. [ ] Login
3. [ ] Upload imagine prin camera
4. [ ] Analizează
5. [ ] Scroll prin rezultate
6. [ ] Click pe ingredient → vezi modal
7. [ ] Close modal
8. [ ] Toggle dark mode
9. [ ] Mergi la Istoric
10. [ ] Toggle favorite pe 2 analize
11. [ ] Mergi la Dashboard
12. [ ] Verifică grafice responsive

---

## 🐛 Bug Testing Checklist

### Edge Cases
1. [ ] Upload imagine foarte mare (>5MB)
2. [ ] Upload imagine cu format exotic (.webp, .heic)
3. [ ] Analiză fără niciun ingredient detectat
4. [ ] Search cu caractere speciale (@#$%)
5. [ ] Filtrare când nu există rezultate
6. [ ] Dashboard fără nicio analiză
7. [ ] Istoric cu 100+ analize (performance)
8. [ ] Toggle dark mode foarte rapid (10x)
9. [ ] Spam click pe buton favorite
10. [ ] Delete în timpul loading-ului

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Chrome Mobile
- [ ] Safari Mobile

### Performance
1. [ ] First load time < 3s
2. [ ] Page transitions < 300ms
3. [ ] Search filtering instant (<100ms)
4. [ ] Chart rendering < 1s
5. [ ] PDF generation < 2s
6. [ ] Theme switch < 500ms

---

## ✅ Acceptance Criteria

### Pentru a considera implementarea completă:

**Export PDF:**
- [x] PDF se generează fără erori
- [x] Conține toate datele (ingrediente, nutriție)
- [x] Layout profesional

**Grafice:**
- [x] Pie și Bar charts funcționale
- [x] Interactive (tooltips, hover)
- [x] Responsive

**Căutare/Filtre:**
- [x] Search real-time
- [x] 3 tipuri de filtre
- [x] 6 opțiuni sortare
- [x] Counter rezultate

**Dashboard:**
- [x] 4 stat cards
- [x] 2 grafice (Line, Bar)
- [x] Heatmap
- [x] Toggle 7/30 zile

**Dark Mode:**
- [x] Toggle funcțional
- [x] Toate componentele adaptate
- [x] Persistență localStorage
- [x] Tranziții smooth

**Favorite:**
- [x] Backend endpoint
- [x] Toggle UI
- [x] Filtrare
- [x] Persistență MongoDB

**Responsive:**
- [x] 4 breakpoints
- [x] Toate paginile responsive
- [x] Touch-friendly
- [x] Funcționalitate păstrată

**Animații:**
- [x] 15+ keyframes
- [x] Skeleton loaders
- [x] Smooth transitions
- [x] Reduced motion support

---

## 📊 Test Results Template

```
Date: __________
Tester: __________
Browser: __________
Device: __________

Feature 1 - Export PDF: ✅ / ❌
Notes: _____________________

Feature 2 - Grafice: ✅ / ❌
Notes: _____________________

Feature 3 - Căutare: ✅ / ❌
Notes: _____________________

Feature 4 - Dashboard: ✅ / ❌
Notes: _____________________

Feature 5 - Dark Mode: ✅ / ❌
Notes: _____________________

Feature 6 - Favorite: ✅ / ❌
Notes: _____________________

Feature 7 - Responsive: ✅ / ❌
Notes: _____________________

Feature 8 - Animații: ✅ / ❌
Notes: _____________________

Overall Status: PASS / FAIL
```

---

**Baftă la testare! 🚀**

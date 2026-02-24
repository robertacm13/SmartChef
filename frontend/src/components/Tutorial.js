import React, { useState } from 'react';
import './Tutorial.css';

const tutorialSteps = [
  {
    title: "Bine ai venit la SmartChef! 👋",
    content: "Aplicația ta pentru analiza nutrițională cu AI",
    emoji: "🍽️",
    description: "Descoperă informații nutriționale detaliate despre alimentele tale folosind inteligența artificială."
  },
  {
    title: "Analizează alimentele 📸",
    content: "Încarcă o imagine cu mâncarea ta și AI-ul va detecta ingredientele",
    emoji: "📷",
    description: "Fă o fotografie sau încarcă o imagine existentă. AI-ul nostru va identifica automat ingredientele și va calcula valorile nutriționale."
  },
  {
    title: "Vezi istoricul 📊",
    content: "Toate analizele tale sunt salvate și poți urmări progresul",
    emoji: "📈",
    description: "Vizualizează istoric complet, statistici detaliate și monitorizează-ți evoluția în timp. Poți sorta, filtra și marca analizele ca favorite."
  },
  {
    title: "Setează obiective 🎯",
    content: "Stabilește obiective nutriționale personalizate",
    emoji: "⚖️",
    description: "Configurează profilul tău personal, setează obiective calorice zilnice și urmărește-ți greutatea pentru rezultate optime."
  }
];

export default function Tutorial({ onComplete }) {
  const [step, setStep] = useState(0);
  
  const nextStep = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('tutorial_completed', 'true');
      onComplete();
    }
  };
  
  const skipTutorial = () => {
    localStorage.setItem('tutorial_completed', 'true');
    onComplete();
  };
  
  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };
  
  return (
    <div className="tutorial-overlay" role="dialog" aria-labelledby="tutorial-title" aria-modal="true">
      <div className="tutorial-modal">
        <button 
          className="tutorial-skip-btn" 
          onClick={skipTutorial}
          aria-label="Omite tutorial"
        >
          Omite tutorial ✕
        </button>
        
        <div className="tutorial-content">
          <div className="tutorial-emoji">
            {tutorialSteps[step].emoji}
          </div>
          
          <h2 id="tutorial-title" className="tutorial-title">
            {tutorialSteps[step].title}
          </h2>
          
          <p className="tutorial-main-content">
            {tutorialSteps[step].content}
          </p>
          
          <p className="tutorial-description">
            {tutorialSteps[step].description}
          </p>
        </div>
        
        <div className="tutorial-progress">
          {tutorialSteps.map((_, i) => (
            <button
              key={i}
              className={`tutorial-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
              onClick={() => setStep(i)}
              aria-label={`Pasul ${i + 1}`}
              aria-current={i === step ? 'step' : undefined}
            />
          ))}
        </div>
        
        <div className="tutorial-actions">
          {step > 0 && (
            <button 
              onClick={prevStep} 
              className="tutorial-btn tutorial-btn-secondary"
              aria-label="Pasul anterior"
            >
              ← Înapoi
            </button>
          )}
          
          <button 
            onClick={nextStep} 
            className="tutorial-btn tutorial-btn-primary"
            style={{ marginLeft: step === 0 ? 'auto' : '0' }}
            aria-label={step < tutorialSteps.length - 1 ? 'Pasul următor' : 'Începe aplicația'}
          >
            {step < tutorialSteps.length - 1 ? 'Următorul →' : 'Începe! 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}

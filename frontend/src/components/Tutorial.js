import React, { useState } from 'react';
import './Tutorial.css';

const tutorialSteps = [
  {
    title: "Welcome to SmartChef! 👋",
    content: "Your AI food nutrition analysis app",
    emoji: "🍽️",
    description: "Discover detailed nutritional information about your foods using artificial intelligence."
  },
  {
    title: "Analyze Foods 📸",
    content: "Upload a photo of your meal and AI detects ingredients",
    emoji: "📷",
    description: "Take a photo or upload an existing image. Our AI will automatically identify ingredients and calculate nutritional values."
  },
  {
    title: "View History 📊",
    content: "All your analyses are saved and you can track progress",
    emoji: "📈",
    description: "View complete history, detailed statistics and monitor your evolution over time. You can sort, filter and mark analyses as favorites."
  },
  {
    title: "Set Goals 🎯",
    content: "Establish personalized nutritional objectives",
    emoji: "⚖️",
    description: "Configure your personal profile, set daily calorie targets and track your weight for optimal results."
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
          aria-label="Skip tutorial"
        >
          Skip tutorial ✗
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
              aria-label={`Step ${i + 1}`}
              aria-current={i === step ? 'step' : undefined}
            />
          ))}
        </div>
        
        <div className="tutorial-actions">
          {step > 0 && (
            <button 
              onClick={prevStep} 
              className="tutorial-btn tutorial-btn-secondary"
              aria-label="Previous step"
            >
              ← Back
            </button>
          )}
          
          <button 
            onClick={nextStep} 
            className="tutorial-btn tutorial-btn-primary"
            style={{ marginLeft: step === 0 ? 'auto' : '0' }}
            aria-label={step < tutorialSteps.length - 1 ? 'Next step' : 'Start app'}
          >
            {step < tutorialSteps.length - 1 ? 'Next →' : 'Start! 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}

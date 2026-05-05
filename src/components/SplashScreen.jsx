import React, { useEffect, useState } from 'react';
import { Coins, Home, Users, Shield } from 'lucide-react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setFadeOut(true);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className={`splash-container ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        {/* Animated Logo */}
        <div className="logo-animation">
          <div className="orbit">
            <Coins className="icon-coins" size={48} />
          </div>
          <div className="orbit-delayed">
            <Home className="icon-home" size={32} />
          </div>
          <div className="orbit-delayed-2">
            <Users className="icon-users" size={32} />
          </div>
        </div>

        <h1 className="splash-title">JIMPITAN</h1>
        <p className="splash-subtitle">RT 03/RW 05</p>
        
        <div className="loading-bar-container">
          <div className="loading-bar" style={{ width: `${progress}%` }}></div>
        </div>
        
        <p className="loading-text">{progress}% Loading...</p>

        <div className="feature-icons">
          <div className="feature-item">
            <Shield size={20} />
            <span>Aman</span>
          </div>
          <div className="feature-item">
            <Coins size={20} />
            <span>Cepat</span>
          </div>
          <div className="feature-item">
            <Users size={20} />
            <span>Terorganisir</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
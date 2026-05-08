import React from 'react';
import './SkeletonLoader.css';

// Generic Skeleton component
export function Skeleton({ width, height, borderRadius = '8px', className = '' }) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

// Analysis Card Skeleton (pentru History.js)
export function AnalysisCardSkeleton() {
  return (
    <div className="skeleton-analysis-card">
      <div className="skeleton-card-header">
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <Skeleton width="120px" height="20px" />
        <Skeleton width="40px" height="40px" borderRadius="50%" />
      </div>
      
      <Skeleton width="100%" height="180px" borderRadius="12px" className="skeleton-image" />
      
      <div className="skeleton-card-content">
        <Skeleton width="70%" height="24px" className="skeleton-title" />
        <Skeleton width="50%" height="16px" className="skeleton-subtitle" />
        
        <div className="skeleton-stats">
          <Skeleton width="30%" height="14px" />
          <Skeleton width="30%" height="14px" />
          <Skeleton width="30%" height="14px" />
        </div>
      </div>
    </div>
  );
}

// Stat Card Skeleton (pentru Dashboard.js)
export function StatCardSkeleton() {
  return (
    <div className="skeleton-stat-card">
      <Skeleton width="48px" height="48px" borderRadius="12px" className="skeleton-icon" />
      <Skeleton width="80%" height="20px" className="skeleton-stat-label" />
      <Skeleton width="60%" height="36px" className="skeleton-stat-value" />
      <Skeleton width="50%" height="14px" className="skeleton-stat-change" />
    </div>
  );
}

// Chart Skeleton (pentru Dashboard.js)
export function ChartSkeleton({ height = '300px' }) {
  return (
    <div className="skeleton-chart" style={{ height }}>
      <div className="skeleton-chart-header">
        <Skeleton width="180px" height="24px" />
        <Skeleton width="100px" height="32px" borderRadius="20px" />
      </div>
      
      <div className="skeleton-chart-content">
        {/* Bars simulation */}
        <div className="skeleton-bars">
          {[60, 80, 45, 90, 70, 55, 75].map((height, i) => (
            <Skeleton 
              key={i}
              width="40px" 
              height={`${height}%`} 
              borderRadius="4px"
            />
          ))}
        </div>
      </div>
      
      <div className="skeleton-chart-legend">
        <Skeleton width="120px" height="16px" />
        <Skeleton width="100px" height="16px" />
      </div>
    </div>
  );
}

// Table Skeleton (pentru History.js cu tabel)
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array(columns).fill(0).map((_, i) => (
          <Skeleton key={i} width={`${100 / columns - 2}%`} height="20px" />
        ))}
      </div>
      
      {Array(rows).fill(0).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array(columns).fill(0).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              width={`${100 / columns - 2}%`} 
              height="16px" 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Form Skeleton (pentru Settings pages)
export function FormSkeleton() {
  return (
    <div className="skeleton-form">
      <Skeleton width="40%" height="28px" className="skeleton-form-title" />
      
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-form-group">
          <Skeleton width="120px" height="18px" className="skeleton-label" />
          <Skeleton width="100%" height="48px" borderRadius="12px" className="skeleton-input" />
        </div>
      ))}
      
      <div className="skeleton-form-actions">
        <Skeleton width="120px" height="44px" borderRadius="22px" />
        <Skeleton width="120px" height="44px" borderRadius="22px" />
      </div>
    </div>
  );
}

// Profile Skeleton (pentru AccountSettings.js)
export function ProfileSkeleton() {
  return (
    <div className="skeleton-profile">
      <div className="skeleton-profile-header">
        <Skeleton width="100px" height="100px" borderRadius="50%" />
        <div className="skeleton-profile-info">
          <Skeleton width="200px" height="28px" />
          <Skeleton width="160px" height="18px" />
          <Skeleton width="180px" height="18px" />
        </div>
      </div>
      
      <div className="skeleton-profile-stats">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-stat-item">
            <Skeleton width="60px" height="32px" />
            <Skeleton width="80px" height="16px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Generic Grid Skeleton
export function GridSkeleton({ items = 6, columns = 3 }) {
  return (
    <div 
      className="skeleton-grid" 
      style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '1.5rem'
      }}
    >
      {Array(items).fill(0).map((_, i) => (
        <AnalysisCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Loading Spinner with message (alternativă la skeleton)
export function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

export default {
  Skeleton,
  AnalysisCardSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  FormSkeleton,
  ProfileSkeleton,
  GridSkeleton,
  LoadingSpinner
};


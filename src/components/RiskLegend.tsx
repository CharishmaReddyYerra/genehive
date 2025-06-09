import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

interface RiskLegendProps {
  darkMode?: boolean;
  className?: string;
}

const RiskLegend: React.FC<RiskLegendProps> = ({ darkMode = false, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const riskLevels = [
    { color: '#ef4444', emoji: '🟥', label: 'Diagnosed', description: 'Currently diagnosed with condition' },
    { color: '#f97316', emoji: '🟧', label: 'High Risk', description: '60%+ probability based on family history' },
    { color: '#eab308', emoji: '🟨', label: 'Medium Risk', description: '30-60% probability based on family history' },
    { color: '#22c55e', emoji: '🟩', label: 'Low Risk', description: 'Under 30% probability based on family history' }
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          darkMode 
            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
        title="Risk Level Legend"
      >
        <Info className="w-4 h-4" />
        <span className="text-sm font-medium">Risk Legend</span>
      </button>

      {/* Expanded Legend */}
      {isExpanded && (
        <div className={`absolute top-full left-0 mt-2 w-80 p-4 rounded-lg border shadow-lg z-50 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Risk Level Guide
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className={`p-1 rounded hover:bg-opacity-20 ${
                darkMode ? 'hover:bg-white' : 'hover:bg-gray-500'
              }`}
            >
              <X className={`w-4 h-4 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </button>
          </div>
          
          <div className="space-y-3">
            {riskLevels.map((level, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-lg" title={level.label}>
                  {level.emoji}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium text-sm ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {level.label}
                    </span>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: level.color }}
                    />
                  </div>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {level.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className={`mt-4 pt-3 border-t text-xs ${
            darkMode 
              ? 'border-gray-700 text-gray-400' 
              : 'border-gray-200 text-gray-500'
          }`}>
            <p className="mb-1">
              <strong>Note:</strong> Risk calculations are based on family history patterns and should not replace professional medical advice.
            </p>
            <p>
              Consult with a genetic counselor for personalized risk assessment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskLegend;
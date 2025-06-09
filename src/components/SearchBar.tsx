import React, { useState, useMemo } from 'react';
import { Search, X, User } from 'lucide-react';
import { FamilyMember } from '../types';

interface SearchBarProps {
  familyMembers: FamilyMember[];
  onMemberSelect: (member: FamilyMember) => void;
  darkMode?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  familyMembers, 
  onMemberSelect, 
  darkMode = false,
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    return familyMembers.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.diseases.some(disease => 
        disease.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      member.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.age.toString().includes(searchTerm)
    ).slice(0, 8); // Limit results to prevent overwhelming UI
  }, [familyMembers, searchTerm]);

  const handleMemberClick = (member: FamilyMember) => {
    onMemberSelect(member);
    setSearchTerm('');
    setIsOpen(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.trim().length > 0);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim().length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicking on results
    setTimeout(() => setIsOpen(false), 150);
  };

  const getRiskColor = (member: FamilyMember): string => {
    if (member.diseases.length > 0) return '#dc2626'; // Red for diagnosed
    if (!member.riskScores || Object.keys(member.riskScores).length === 0) return '#22c55e'; // Green for low/no risk
    
    const maxRiskScore = Math.max(...Object.values(member.riskScores));
    if (maxRiskScore >= 0.6) return '#f97316'; // Orange for high risk
    if (maxRiskScore >= 0.3) return '#eab308'; // Yellow for medium risk
    return '#22c55e'; // Green for low risk
  };

  const getRiskLabel = (member: FamilyMember) => {
    if (member.diseases.length > 0) return 'Diagnosed';
    if (!member.riskScores || Object.keys(member.riskScores).length === 0) return 'Low Risk';
    
    const maxRiskScore = Math.max(...Object.values(member.riskScores));
    if (maxRiskScore >= 0.6) return 'High Risk';
    if (maxRiskScore >= 0.3) return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`w-4 h-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Search family members..."
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            darkMode
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
        
        {searchTerm && (
          <button
            onClick={clearSearch}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && filteredMembers.length > 0 && (
        <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto ${
          darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          {filteredMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => handleMemberClick(member)}
              className={`w-full px-4 py-3 text-left hover:bg-opacity-50 transition-colors border-b last:border-b-0 ${
                darkMode
                  ? 'hover:bg-gray-700 border-gray-700'
                  : 'hover:bg-gray-50 border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <User className={`w-4 h-4 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium truncate ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {member.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full text-white`}
                          style={{ backgroundColor: getRiskColor(member) }}>
                      {getRiskLabel(member)}
                    </span>
                  </div>
                  
                  <div className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <span>Age {member.age} • {member.gender}</span>
                    {member.diseases.length > 0 && (
                      <span className="ml-2">
                        • {member.diseases.map(d => d.name).join(', ')}
                      </span>
                    )}
                  </div>
                  
                  {member.riskScores && Object.keys(member.riskScores).length > 0 && (
                    <div className={`text-xs mt-1 ${
                      darkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      Risk Score: {(Math.max(...Object.values(member.riskScores)) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
          
          {searchTerm.trim() && filteredMembers.length === 0 && (
            <div className={`px-4 py-6 text-center ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No family members found</p>
              <p className="text-xs mt-1">Try searching by name, age, gender, or condition</p>
            </div>
          )}
        </div>
      )}
      
      {/* Search Tips */}
      {isOpen && searchTerm.trim() === '' && (
        <div className={`absolute top-full left-0 right-0 mt-1 p-4 border rounded-lg shadow-lg z-50 ${
          darkMode
            ? 'bg-gray-800 border-gray-700 text-gray-400'
            : 'bg-white border-gray-200 text-gray-600'
        }`}>
          <p className="text-sm font-medium mb-2">Search Tips:</p>
          <ul className="text-xs space-y-1">
            <li>• Search by name (e.g., "John", "Mary")</li>
            <li>• Search by condition (e.g., "diabetes", "BRCA")</li>
            <li>• Search by age or gender</li>
            <li>• Results will highlight matching members</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
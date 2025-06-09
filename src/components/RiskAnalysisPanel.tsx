import React, { useState, useMemo } from 'react';
import { FamilyMember, Disease, GeneticRisk } from '../types';
import { GeneticSimulator } from '../utils/geneticSimulation';
import { ApiService, FallbackService } from '../services/api';
import { AlertTriangle, Info, TrendingUp, TrendingDown, Heart, Brain, Dna, Eye, EyeOff } from 'lucide-react';

interface RiskAnalysisPanelProps {
  selectedMember: FamilyMember | null;
  familyMembers: FamilyMember[];
  diseases: Disease[];
  onMemberSelect: (member: FamilyMember) => void;
}

const RiskAnalysisPanel: React.FC<RiskAnalysisPanelProps> = ({
  selectedMember,
  familyMembers,
  diseases,
  onMemberSelect
}) => {
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<{ [key: string]: string }>({});
  const [loadingExplanations, setLoadingExplanations] = useState<Set<string>>(new Set());
  const [showAllMembers, setShowAllMembers] = useState(false);

  // Calculate risk analysis for all members
  const riskAnalysis = useMemo(() => {
    if (familyMembers.length === 0) return [];
    return GeneticSimulator.calculateFamilyRisks(familyMembers, diseases);
  }, [familyMembers, diseases]);

  // Get risks for selected member
  const selectedMemberRisks = useMemo(() => {
    if (!selectedMember) return [];
    return riskAnalysis.filter(risk => risk.memberId === selectedMember.id);
  }, [riskAnalysis, selectedMember]);

  // Get high-risk members across the family
  const highRiskMembers = useMemo(() => {
    const memberRiskMap = new Map<string, { member: FamilyMember; maxRisk: number; riskCount: number }>();
    
    riskAnalysis.forEach(risk => {
      const member = familyMembers.find(m => m.id === risk.memberId);
      if (!member) return;
      
      const existing = memberRiskMap.get(member.id);
      if (!existing) {
        memberRiskMap.set(member.id, {
          member,
          maxRisk: risk.riskScore,
          riskCount: risk.riskScore > 0.3 ? 1 : 0
        });
      } else {
        existing.maxRisk = Math.max(existing.maxRisk, risk.riskScore);
        if (risk.riskScore > 0.3) existing.riskCount++;
      }
    });
    
    return Array.from(memberRiskMap.values())
      .filter(item => item.maxRisk > 0.3)
      .sort((a, b) => b.maxRisk - a.maxRisk);
  }, [riskAnalysis, familyMembers]);

  const getRiskLevel = (score: number): { level: string; color: string; icon: React.ReactNode } => {
    if (score >= 0.7) {
      return {
        level: 'High Risk',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />
      };
    } else if (score >= 0.3) {
      return {
        level: 'Moderate Risk',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: <TrendingUp className="w-4 h-4 text-yellow-600" />
      };
    } else {
      return {
        level: 'Low Risk',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: <TrendingDown className="w-4 h-4 text-green-600" />
      };
    }
  };

  const getDiseaseIcon = (diseaseId: string) => {
    if (diseaseId.includes('heart') || diseaseId.includes('hypertension')) {
      return <Heart className="w-4 h-4" />;
    } else if (diseaseId.includes('alzheimer') || diseaseId.includes('huntington')) {
      return <Brain className="w-4 h-4" />;
    } else if (diseaseId.includes('color-blindness')) {
      return <Eye className="w-4 h-4" />;
    }
    return <Dna className="w-4 h-4" />;
  };

  const getAIExplanation = async (member: FamilyMember, disease: Disease, riskScore: number) => {
    const key = `${member.id}-${disease.id}`;
    
    if (aiExplanations[key]) {
      setExpandedRisk(expandedRisk === key ? null : key);
      return;
    }

    setLoadingExplanations(prev => new Set(prev).add(key));
    
    try {
      let explanation: string;
      
      try {
        explanation = await ApiService.getPersonalizedExplanation(member, disease, familyMembers);
      } catch (error) {
        // Fallback to local explanation
        explanation = FallbackService.generateFallbackExplanation(member, disease, riskScore);
      }
      
      setAiExplanations(prev => ({ ...prev, [key]: explanation }));
      setExpandedRisk(key);
    } catch (error) {
      console.error('Failed to get AI explanation:', error);
    } finally {
      setLoadingExplanations(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  if (familyMembers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-500">
          <Dna className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Family Data</h3>
          <p>Add family members to see genetic risk analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Member Analysis */}
      {selectedMember && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Dna className="w-5 h-5 text-primary-600" />
              Risk Analysis: {selectedMember.name}
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedMember.gender === 'male' ? 'Male' : 'Female'}, Age {selectedMember.age}
            </p>
          </div>
          
          <div className="p-6">
            {selectedMemberRisks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No genetic risk data available. Run simulation to calculate risks.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedMemberRisks.map((risk) => {
                  const disease = diseases.find(d => d.id === risk.diseaseId);
                  if (!disease) return null;
                  
                  const riskInfo = getRiskLevel(risk.riskScore);
                  const key = `${risk.memberId}-${risk.diseaseId}`;
                  const isExpanded = expandedRisk === key;
                  const isLoading = loadingExplanations.has(key);
                  
                  return (
                    <div key={key} className="border rounded-lg overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getDiseaseIcon(disease.id)}
                            <div>
                              <h3 className="font-semibold text-gray-900">{disease.name}</h3>
                              <p className="text-sm text-gray-600 capitalize">{disease.type} inheritance</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${riskInfo.color}`}>
                            {riskInfo.icon}
                            <span className="ml-1">{(risk.riskScore * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        
                        {/* Risk bar */}
                        <div className="mb-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                risk.riskScore >= 0.7 ? 'bg-red-500' :
                                risk.riskScore >= 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.max(risk.riskScore * 100, 5)}%` }}
                            />
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{risk.explanation}</p>
                        
                        <button
                          onClick={() => getAIExplanation(selectedMember, disease, risk.riskScore)}
                          disabled={isLoading}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                        >
                          {isLoading ? (
                            <div className="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full" />
                          ) : (
                            <Info className="w-4 h-4" />
                          )}
                          {isExpanded ? 'Hide' : 'Get'} AI Explanation
                        </button>
                      </div>
                      
                      {isExpanded && aiExplanations[key] && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Brain className="w-3 h-3 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                  {aiExplanations[key]}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Family Overview */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Family Risk Overview
            </h2>
            <button
              onClick={() => setShowAllMembers(!showAllMembers)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
            >
              {showAllMembers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAllMembers ? 'Show High Risk Only' : 'Show All Members'}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {highRiskMembers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <TrendingDown className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="font-medium text-green-600">No High-Risk Members Identified</p>
              <p className="text-sm">All family members show low genetic risk based on current data.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(showAllMembers ? 
                familyMembers.map(member => {
                  const memberRisks = riskAnalysis.filter(r => r.memberId === member.id);
                  const maxRisk = Math.max(...memberRisks.map(r => r.riskScore), 0);
                  return { member, maxRisk, riskCount: memberRisks.filter(r => r.riskScore > 0.3).length };
                }) :
                highRiskMembers
              ).map(({ member, maxRisk, riskCount }) => {
                const riskInfo = getRiskLevel(maxRisk);
                const isSelected = selectedMember?.id === member.id;
                
                return (
                  <div
                    key={member.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary-500 border-primary-300' : 'hover:border-gray-300'
                    }`}
                    onClick={() => onMemberSelect(member)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          member.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
                        }`} />
                        <div>
                          <h3 className="font-semibold text-gray-900">{member.name}</h3>
                          <p className="text-sm text-gray-600">
                            Age {member.age} • {riskCount} condition{riskCount !== 1 ? 's' : ''} at risk
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full border text-sm font-medium ${riskInfo.color}`}>
                        {riskInfo.icon}
                        <span className="ml-1">{(maxRisk * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    {member.diseases.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600 mb-2">Current conditions:</p>
                        <div className="flex flex-wrap gap-2">
                          {member.diseases.map(disease => (
                            <span
                              key={disease.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                              style={{ backgroundColor: disease.color + '20', color: disease.color }}
                            >
                              {disease.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisPanel;
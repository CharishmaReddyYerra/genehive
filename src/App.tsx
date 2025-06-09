import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FamilyMember, Disease, FamilyTreeState } from './types';
import { PREDEFINED_DISEASES } from './data/diseases';
import { createSampleFamily, createExtendedSampleFamily } from './data/sampleFamily';
import { ApiService } from './services/api';
import FamilyTree3D from './components/FamilyTree3D';
import FamilyMemberForm from './components/FamilyMemberForm';
import AIChat from './components/AIChat';
import RiskAnalysisPanel from './components/RiskAnalysisPanel';
import RiskTrendsPanel from './components/RiskTrendsPanel';
import RiskLegend from './components/RiskLegend';
import ExportReport from './components/ExportReport';
import SearchBar from './components/SearchBar';
import SessionRecoveryDialog from './components/SessionRecoveryDialog';
import { useAutoSave } from './utils/autoSave';
import { 
  Users, 
  Plus, 
  BarChart3, 
  TrendingUp,
  MessageSquare, 
  Download, 
  Upload, 
  Trash2, 
  Play, 
  Moon, 
  Sun,
  Dna,
  Settings,
  Info
} from 'lucide-react';

const App: React.FC = () => {
  // Refs
  const treeRef = useRef<HTMLDivElement>(null);
  
  // Core state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [diseases] = useState<Disease[]>(PREDEFINED_DISEASES);
  
  // Auto-save functionality
  const {
    startAutoSave,
    stopAutoSave,
    saveData,
    loadSavedData,
    hasRecentSave,
    getLastSaveTime,
    clearSavedData,
    getSaveInfo
  } = useAutoSave();
  
  // Session recovery state
  const [showSessionRecovery, setShowSessionRecovery] = useState(false);
  const [sessionRecoveryHandled, setSessionRecoveryHandled] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'tree' | 'analysis' | 'trends' | 'chat'>('tree');
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Chat state
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  
  // Load sample data on mount and check for session recovery
  useEffect(() => {
    // Only check for session recovery if it hasn't been handled yet
    if (!sessionRecoveryHandled) {
      // Check for auto-saved session
      if (hasRecentSave()) {
        setShowSessionRecovery(true);
      } else {
        const sampleFamily = createExtendedSampleFamily();
        setFamilyMembers(sampleFamily);
        if (sampleFamily.length > 0) {
          setSelectedMember(sampleFamily[0]);
        }
        setSessionRecoveryHandled(true);
      }
    }
    
    // Start auto-save
    startAutoSave(() => familyMembers);
    
    // Cleanup on unmount
    return () => {
      stopAutoSave();
    };
  }, [sessionRecoveryHandled, hasRecentSave, startAutoSave, stopAutoSave]);

  // Auto-save when family data changes
  useEffect(() => {
    if (familyMembers.length > 0) {
      saveData(familyMembers);
    }
  }, [familyMembers, saveData]);

  // Session recovery handlers
  const handleRecoverSession = useCallback(() => {
    const savedData = loadSavedData();
    if (savedData && savedData.familyMembers.length > 0) {
      setFamilyMembers(savedData.familyMembers);
      setSelectedMember(savedData.familyMembers[0]);
    }
    setShowSessionRecovery(false);
    setSessionRecoveryHandled(true);
  }, [loadSavedData]);

  const handleStartFresh = () => {
    clearSavedData();
    const sampleFamily = createExtendedSampleFamily();
    setFamilyMembers(sampleFamily);
    if (sampleFamily.length > 0) {
      setSelectedMember(sampleFamily[0]);
    }
    setShowSessionRecovery(false);
    setSessionRecoveryHandled(true);
  };

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAddMember = useCallback((memberData: Omit<FamilyMember, 'id'>) => {
    const newMember: FamilyMember = {
      ...memberData,
      id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    setFamilyMembers(prev => [...prev, newMember]);
    setSelectedMember(newMember);
    setShowMemberForm(false);
  }, []);

  const handleEditMember = useCallback((memberData: Omit<FamilyMember, 'id'>) => {
    if (!editingMember) return;
    
    const updatedMember: FamilyMember = {
      ...memberData,
      id: editingMember.id
    };
    
    setFamilyMembers(prev => 
      prev.map(member => member.id === editingMember.id ? updatedMember : member)
    );
    
    if (selectedMember?.id === editingMember.id) {
      setSelectedMember(updatedMember);
    }
    
    setEditingMember(null);
    setShowMemberForm(false);
  }, [editingMember, selectedMember]);

  const handleDeleteMember = useCallback((memberId: string) => {
    setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
    
    if (selectedMember?.id === memberId) {
      setSelectedMember(null);
    }
  }, [selectedMember]);

  const handleRunSimulation = useCallback(async () => {
    if (familyMembers.length === 0) return;
    
    setIsSimulating(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would trigger the risk calculation
      // For now, the risk calculation happens automatically in the RiskAnalysisPanel
      console.log('Simulation completed for', familyMembers.length, 'family members');
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  }, [familyMembers]);

  const handleExportData = useCallback(() => {
    const exportData: FamilyTreeState = {
      members: familyMembers,
      selectedMember,
      diseases,
      simulationResults: null,
      isSimulating: false,
      chatMessages: []
    };
    
    const exportDataWithMetadata = {
      ...exportData,
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        memberCount: familyMembers.length
      }
    };
    
    const dataStr = JSON.stringify(exportDataWithMetadata, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `genehive-family-tree-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [familyMembers]);

  const handleImportData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData: FamilyTreeState = JSON.parse(e.target?.result as string);
        setFamilyMembers(importData.members);
        setSelectedMember(importData.members[0] || null);
      } catch (error) {
        console.error('Failed to import data:', error);
        alert('Failed to import family tree data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  }, []);

  const handleClearData = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all family data? This action cannot be undone.')) {
      setFamilyMembers([]);
      setSelectedMember(null);
    }
  }, []);

  const handleLoadSample = useCallback((type: 'basic' | 'extended') => {
    const sampleData = type === 'basic' ? createSampleFamily() : createExtendedSampleFamily();
    setFamilyMembers(sampleData);
    setSelectedMember(sampleData[0] || null);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-200 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Dna className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  GENEHIVE
                </h1>
                <p className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  AI-Powered Genetic Risk Simulator
                </p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('tree')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'tree'
                    ? 'bg-primary-100 text-primary-700'
                    : darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Family Tree
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analysis'
                    ? 'bg-primary-100 text-primary-700'
                    : darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Risk Analysis
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'trends'
                    ? 'bg-primary-100 text-primary-700'
                    : darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Risk Trends
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-primary-100 text-primary-700'
                    : darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                AI Chat
              </button>
            </nav>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`border-b transition-colors duration-200 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h3 className={`font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Quick Actions
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLoadSample('basic')}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Load Basic Sample
                </button>
                <button
                  onClick={() => handleLoadSample('extended')}
                  className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Load Extended Sample
                </button>
                <label className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 inline mr-1" />
                  Import Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleExportData}
                  disabled={familyMembers.length === 0}
                  className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Export Data
                </button>
                <button
                  onClick={handleClearData}
                  disabled={familyMembers.length === 0}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Bar */}
            <SearchBar
              familyMembers={familyMembers}
              onMemberSelect={setSelectedMember}
            />
            
            {/* Export Report */}
            <ExportReport
              familyMembers={familyMembers}
              diseases={diseases}
              darkMode={darkMode}
              treeRef={treeRef}
            />
            
            {/* Action Buttons */}
            <div className={`rounded-lg shadow-sm border p-4 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEditingMember(null);
                    setShowMemberForm(true);
                  }}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Family Member
                </button>
                
                <button
                  onClick={handleRunSimulation}
                  disabled={familyMembers.length === 0 || isSimulating}
                  className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSimulating ? (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isSimulating ? 'Running...' : 'Run Simulation'}
                </button>
              </div>
            </div>
            
            {/* Family Members List */}
            <div className={`rounded-lg shadow-sm border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Family Members ({familyMembers.length})
                </h3>
              </div>
              <div className="p-4">
                {familyMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className={`w-8 h-8 mx-auto mb-2 ${
                      darkMode ? 'text-gray-600' : 'text-gray-300'
                    }`} />
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      No family members added yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {familyMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedMember?.id === member.id
                            ? 'ring-2 ring-primary-500 border-primary-300'
                            : darkMode
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedMember(member)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              member.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
                            }`} />
                            <div>
                              <p className={`font-medium text-sm ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {member.name}
                              </p>
                              <p className={`text-xs ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                Age {member.age}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMember(member);
                              setShowMemberForm(true);
                            }}
                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            <Settings className="w-3 h-3" />
                          </button>
                        </div>
                        {member.diseases.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {member.diseases.slice(0, 2).map((disease) => (
                              <span
                                key={disease.id}
                                className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                style={{ 
                                  backgroundColor: disease.color + '20', 
                                  color: disease.color 
                                }}
                              >
                                {disease.name}
                              </span>
                            ))}
                            {member.diseases.length > 2 && (
                              <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}>
                                +{member.diseases.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'tree' && (
              <div className={`rounded-lg shadow-sm border overflow-hidden ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div ref={treeRef} className="h-[600px] relative">
                  {familyMembers.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Dna className={`w-16 h-16 mx-auto mb-4 ${
                          darkMode ? 'text-gray-600' : 'text-gray-300'
                        }`} />
                        <h3 className={`text-lg font-medium mb-2 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          No Family Tree Data
                        </h3>
                        <p className={`text-sm mb-4 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Add family members to visualize the 3D family tree.
                        </p>
                        <button
                          onClick={() => setShowMemberForm(true)}
                          className="btn-primary"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Member
                        </button>
                      </div>
                    </div>
                  ) : (
                    <FamilyTree3D
                      members={familyMembers}
                      diseases={diseases}
                      selectedMember={selectedMember}
                      onMemberSelect={setSelectedMember}
                      onMemberHover={() => {}}
                    />
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'analysis' && (
              <div className="space-y-4">
                <RiskAnalysisPanel
                  selectedMember={selectedMember}
                  familyMembers={familyMembers}
                  diseases={diseases}
                  onMemberSelect={setSelectedMember}
                />
                <RiskLegend />
              </div>
            )}
            
            {activeTab === 'trends' && (
              <RiskTrendsPanel
                familyMembers={familyMembers}
                diseases={diseases}
              />
            )}
            
            {activeTab === 'chat' && (
              <div className={`rounded-lg shadow-sm border overflow-hidden ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <AIChat
                  familyMembers={familyMembers}
                  diseases={diseases}
                  selectedMember={selectedMember}
                  isMinimized={false}
                  onToggleMinimize={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Floating AI Chat (when not in chat tab) */}
      {activeTab !== 'chat' && (
        <div className="fixed bottom-4 right-4 z-50">
          <AIChat
            familyMembers={familyMembers}
            diseases={diseases}
            selectedMember={selectedMember}
            isMinimized={isChatMinimized}
            onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
          />
        </div>
      )}
      
      {/* Member Form Modal */}
      {showMemberForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-lg shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <FamilyMemberForm
              member={editingMember || undefined}
              existingMembers={familyMembers}
              onSave={editingMember ? handleEditMember : handleAddMember}
              onCancel={() => {
                setShowMemberForm(false);
                setEditingMember(null);
              }}
              isOpen={showMemberForm}
            />
          </div>
        </div>
      )}
      
      {/* Session Recovery Dialog */}
      {showSessionRecovery && (
        <SessionRecoveryDialog
          isOpen={showSessionRecovery}
          recoveryInfo={{
            hasRecoverableData: getSaveInfo().hasData,
            lastSaveTime: getSaveInfo().lastSave,
            memberCount: loadSavedData()?.familyMembers.length || 0,
            isRecent: getSaveInfo().isRecent
          }}
          onRecover={handleRecoverSession}
          onDismiss={handleStartFresh}
        />
      )}
    </div>
  );
};

export default App;
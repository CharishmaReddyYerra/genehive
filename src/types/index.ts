export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  parentIds: string[];
  childrenIds: string[];
  diseases: Disease[];
  riskScores: { [diseaseId: string]: number };
  position: { x: number; y: number; z: number };
  generation: number;
}

export interface Disease {
  id: string;
  name: string;
  type: 'dominant' | 'recessive' | 'x-linked' | 'multifactorial';
  prevalence: number; // Base population prevalence (0-1)
  penetrance: number; // Probability of expression given genotype (0-1)
  description: string;
  color: string;
}

export interface GeneticRisk {
  memberId: string;
  diseaseId: string;
  riskScore: number;
  inheritancePattern: string;
  explanation: string;
}

export interface SimulationResult {
  familyTree: FamilyMember[];
  riskAnalysis: GeneticRisk[];
  aiExplanation: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface FamilyTreeState {
  members: FamilyMember[];
  selectedMember: FamilyMember | null;
  diseases: Disease[];
  simulationResults: SimulationResult | null;
  isSimulating: boolean;
  chatMessages: ChatMessage[];
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface TreeLayoutConfig {
  generationSpacing: number;
  siblingSpacing: number;
  branchSpacing: number;
}

export type RelationType = 'parent' | 'child' | 'sibling' | 'spouse';

export interface Relationship {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  type: RelationType;
}

export interface DiseasePreset {
  id: string;
  name: string;
  diseases: Disease[];
  description: string;
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'json';
  includeRiskScores: boolean;
  includeAIExplanation: boolean;
  resolution?: 'low' | 'medium' | 'high';
}
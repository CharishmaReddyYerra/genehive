import axios from 'axios';
import { FamilyMember, Disease, GeneticRisk, ChatMessage } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.response?.status === 500) {
      console.error('Server Error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export interface SimulationRequest {
  family_members: FamilyMember[];
  diseases: Disease[];
}

export interface SimulationResponse {
  risk_analysis: GeneticRisk[];
  ai_explanation: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  family_context?: {
    members: FamilyMember[];
    diseases: Disease[];
    selected_member?: FamilyMember;
  };
}

export interface ChatResponse {
  response: string;
  timestamp: string;
}

export class ApiService {
  /**
   * Run genetic simulation for a family tree
   */
  static async runSimulation(
    familyMembers: FamilyMember[],
    diseases: Disease[]
  ): Promise<SimulationResponse> {
    try {
      const request: SimulationRequest = {
        family_members: familyMembers,
        diseases: diseases
      };

      const response = await api.post<SimulationResponse>('/simulate', request);
      return response.data;
    } catch (error) {
      console.error('Simulation API error:', error);
      throw new Error('Failed to run genetic simulation. Please try again.');
    }
  }

  /**
   * Get AI explanation for specific family member risk
   */
  static async getPersonalizedExplanation(
    member: FamilyMember,
    disease: Disease,
    familyMembers: FamilyMember[]
  ): Promise<string> {
    try {
      const request = {
        member,
        disease,
        family_context: familyMembers
      };

      const response = await api.post<{ explanation: string }>('/explain-risk', request);
      return response.data.explanation;
    } catch (error) {
      console.error('Risk explanation API error:', error);
      throw new Error('Failed to get AI explanation. Please try again.');
    }
  }

  /**
   * Chat with AI about genetic risks
   */
  static async chatWithAI(
    message: string,
    familyContext?: {
      members: FamilyMember[];
      diseases: Disease[];
      selected_member?: FamilyMember;
    }
  ): Promise<ChatResponse> {
    try {
      const request: ChatRequest = {
        message,
        family_context: familyContext
      };

      const response = await api.post<ChatResponse>('/chat', request);
      return response.data;
    } catch (error) {
      console.error('Chat API error:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  /**
   * Get available diseases from backend
   */
  static async getDiseases(): Promise<Disease[]> {
    try {
      const response = await api.get<Disease[]>('/diseases');
      return response.data;
    } catch (error) {
      console.error('Get diseases API error:', error);
      throw new Error('Failed to fetch diseases. Using local data.');
    }
  }

  /**
   * Health check for the API
   */
  static async healthCheck(): Promise<{ status: string; ollama_status: string }> {
    try {
      const response = await api.get<{ status: string; ollama_status: string }>('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Backend service is not available.');
    }
  }

  /**
   * Export family tree data
   */
  static async exportFamilyTree(
    familyMembers: FamilyMember[],
    format: 'pdf' | 'png' | 'json'
  ): Promise<Blob> {
    try {
      const request = {
        family_members: familyMembers,
        format
      };

      const response = await api.post('/export', request, {
        responseType: 'blob'
      });

      return response.data;
    } catch (error) {
      console.error('Export API error:', error);
      throw new Error('Failed to export family tree. Please try again.');
    }
  }

  /**
   * Save family tree to backend storage
   */
  static async saveFamilyTree(
    name: string,
    familyMembers: FamilyMember[],
    diseases: Disease[]
  ): Promise<{ id: string }> {
    try {
      const request = {
        name,
        family_members: familyMembers,
        diseases
      };

      const response = await api.post<{ id: string }>('/save-tree', request);
      return response.data;
    } catch (error) {
      console.error('Save tree API error:', error);
      throw new Error('Failed to save family tree. Please try again.');
    }
  }

  /**
   * Load saved family trees
   */
  static async getSavedTrees(): Promise<Array<{
    id: string;
    name: string;
    created_at: string;
    member_count: number;
  }>> {
    try {
      const response = await api.get('/saved-trees');
      return response.data;
    } catch (error) {
      console.error('Get saved trees API error:', error);
      throw new Error('Failed to load saved trees.');
    }
  }

  /**
   * Load a specific family tree
   */
  static async loadFamilyTree(id: string): Promise<{
    family_members: FamilyMember[];
    diseases: Disease[];
    name: string;
  }> {
    try {
      const response = await api.get(`/load-tree/${id}`);
      return response.data;
    } catch (error) {
      console.error('Load tree API error:', error);
      throw new Error('Failed to load family tree.');
    }
  }
}

// Fallback service for when backend is not available
export class FallbackService {
  /**
   * Generate a simple AI-like explanation without backend
   */
  static generateFallbackExplanation(
    member: FamilyMember,
    disease: Disease,
    riskScore: number
  ): string {
    const riskPercentage = (riskScore * 100).toFixed(1);
    
    let explanation = `I understand your concern about ${member.name}'s health. Based on the family history patterns, ${member.name} has a ${riskPercentage}% estimated risk of developing ${disease.name}. `;
    
    if (riskScore > 0.7) {
      explanation += 'This is considered a high risk, which I know can be concerning. ';
    } else if (riskScore > 0.3) {
      explanation += 'This is considered a moderate risk. ';
    } else {
      explanation += 'This is considered a low risk, which is reassuring. ';
    }
    
    explanation += `The inheritance pattern for ${disease.name} is ${disease.type}. `;
    
    if (disease.type === 'dominant') {
      explanation += 'This means only one copy of the gene variant is needed to increase risk. Given this pattern, their children would have a 50% chance of inheriting the increased risk.';
    } else if (disease.type === 'recessive') {
      explanation += 'This means two copies of the gene variant are typically needed. Considering the family history, their children may have elevated risk if both parents carry the variant.';
    } else if (disease.type === 'x-linked') {
      explanation += 'This condition is linked to the X chromosome, which affects inheritance differently for sons and daughters.';
    } else {
      explanation += 'This condition is influenced by multiple genetic and environmental factors, making the inheritance pattern more complex.';
    }
    
    return explanation;
  }

  /**
   * Generate empathetic chat responses with family context
   */
  static generateFallbackChatResponse(
    message: string, 
    familyContext?: {
      members: FamilyMember[];
      diseases: Disease[];
      selected_member?: FamilyMember;
    }
  ): string {
    const lowerMessage = message.toLowerCase();
    const empathyPhrases = [
      "I understand your concern",
      "That's a thoughtful question",
      "I can see why you'd want to know about this",
      "This is an important consideration"
    ];
    
    const getRandomEmpathy = () => empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
    
    // Analyze family context for personalized responses
    let contextInfo = '';
    if (familyContext?.members) {
      const totalMembers = familyContext.members.length;
      const affectedMembers = familyContext.members.filter(m => m.diseases.length > 0).length;
      const generations = new Set(familyContext.members.map(m => m.generation)).size;
      
      if (totalMembers > 0) {
        contextInfo = ` Looking at your family tree with ${totalMembers} members across ${generations} generations, I can see ${affectedMembers} family members have been diagnosed with conditions.`;
      }
    }
    
    if (lowerMessage.includes('risk') || lowerMessage.includes('chance')) {
      return `${getRandomEmpathy()} about genetic risk.${contextInfo} Genetic risk assessment depends on family history patterns, inheritance mechanisms, and environmental factors. Each condition has unique risk factors that we can explore together.`;
    }
    
    if (lowerMessage.includes('children') || lowerMessage.includes('offspring')) {
      let response = `${getRandomEmpathy()} about future generations.`;
      if (familyContext?.selected_member) {
        const member = familyContext.selected_member;
        response += ` Considering ${member.name}'s family history`;
        if (member.diseases.length > 0) {
          response += ` and current diagnosis of ${member.diseases.map(d => d.name).join(', ')}`;
        }
        response += `, their children may have elevated risk depending on the inheritance pattern.`;
      } else {
        response += ` The risk to children depends on the specific conditions in the family and their inheritance patterns.`;
      }
      return response + ` I'd recommend discussing genetic counseling options with a healthcare provider.`;
    }
    
    if (lowerMessage.includes('inherit') || lowerMessage.includes('genetic')) {
      return `${getRandomEmpathy()} about inheritance patterns.${contextInfo} Genetic inheritance follows different patterns: dominant (one copy needed), recessive (two copies needed), X-linked (on X chromosome), and multifactorial (multiple factors). The pattern in your family tree can help us understand the risks better.`;
    }
    
    if (lowerMessage.includes('prevent') || lowerMessage.includes('reduce')) {
      return `${getRandomEmpathy()} about prevention strategies. While we cannot change genetic predisposition, there are many proactive steps that can make a significant difference. Lifestyle modifications, regular screening, early detection, and preventive measures can help reduce disease risk and improve outcomes substantially.`;
    }
    
    if (lowerMessage.includes('test') || lowerMessage.includes('screening')) {
      let response = `${getRandomEmpathy()} about genetic testing.`;
      if (familyContext?.members && familyContext.members.length > 0) {
        const highRiskMembers = familyContext.members.filter(m => 
          (m.riskScores && Object.values(m.riskScores).some(score => score > 0.6)) || m.diseases.length > 0
        ).length;
        if (highRiskMembers > 0) {
          response += ` Given the family history patterns I see, genetic testing might be particularly valuable for ${highRiskMembers} family members who show elevated risk.`;
        }
      }
      return response + ` Genetic testing can provide valuable insights for risk assessment and family planning decisions. I'd recommend discussing this with a genetic counselor.`;
    }
    
    if (lowerMessage.includes('worry') || lowerMessage.includes('scared') || lowerMessage.includes('anxious')) {
      return `I completely understand your feelings - it's natural to feel concerned when dealing with genetic health information.${contextInfo} Remember that having a genetic predisposition doesn't mean someone will definitely develop a condition. Knowledge is power, and understanding your family's health patterns allows for better prevention and early intervention strategies.`;
    }
    
    // Default empathetic response
    return `${getRandomEmpathy()}.${contextInfo} I'm here to help explain genetic risks, inheritance patterns, and family health history in a way that's easy to understand. Please feel free to ask specific questions about genetic conditions, family members, or anything else you'd like to know about.`;
  }
}
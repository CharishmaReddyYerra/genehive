import { FamilyMember, Disease, GeneticRisk } from '../types';

export class GeneticSimulator {
  /**
   * Calculate risk scores for all family members based on genetic inheritance patterns
   */
  static calculateFamilyRisks(members: FamilyMember[], diseases: Disease[]): GeneticRisk[] {
    const risks: GeneticRisk[] = [];
    
    // Reset all risk scores
    members.forEach(member => {
      member.riskScores = {};
    });

    // Calculate risks for each disease
    diseases.forEach(disease => {
      const diseaseRisks = this.calculateDiseaseRisks(members, disease);
      risks.push(...diseaseRisks);
    });

    return risks;
  }

  /**
   * Calculate risk for a specific disease across all family members
   */
  private static calculateDiseaseRisks(members: FamilyMember[], disease: Disease): GeneticRisk[] {
    const risks: GeneticRisk[] = [];
    const memberMap = new Map(members.map(m => [m.id, m]));

    members.forEach(member => {
      const risk = this.calculateMemberDiseaseRisk(member, disease, memberMap);
      member.riskScores[disease.id] = risk.riskScore;
      risks.push(risk);
    });

    return risks;
  }

  /**
   * Calculate disease risk for a specific family member
   */
  private static calculateMemberDiseaseRisk(
    member: FamilyMember,
    disease: Disease,
    memberMap: Map<string, FamilyMember>
  ): GeneticRisk {
    // If member already has the disease, risk is 100%
    if (member.diseases.some(d => d.id === disease.id)) {
      return {
        memberId: member.id,
        diseaseId: disease.id,
        riskScore: 1.0,
        inheritancePattern: 'affected',
        explanation: `${member.name} is already affected by ${disease.name}.`
      };
    }

    let riskScore = disease.prevalence; // Start with base population risk
    let explanation = `Base population risk: ${(disease.prevalence * 100).toFixed(1)}%`;
    let inheritancePattern = 'population';

    // Get parents
    const parents = member.parentIds
      .map(id => memberMap.get(id))
      .filter(Boolean) as FamilyMember[];

    if (parents.length > 0) {
      const parentalRisk = this.calculateParentalRisk(parents, disease, member.gender);
      riskScore = this.combineRisks(riskScore, parentalRisk.risk);
      inheritancePattern = parentalRisk.pattern;
      explanation += ` Parental contribution: ${(parentalRisk.risk * 100).toFixed(1)}% (${parentalRisk.pattern})`;
    }

    // Apply penetrance
    riskScore *= disease.penetrance;

    // Cap at 95% to account for incomplete penetrance and environmental factors
    riskScore = Math.min(riskScore, 0.95);

    return {
      memberId: member.id,
      diseaseId: disease.id,
      riskScore,
      inheritancePattern,
      explanation
    };
  }

  /**
   * Calculate risk contribution from parents based on inheritance pattern
   */
  private static calculateParentalRisk(
    parents: FamilyMember[],
    disease: Disease,
    childGender: 'male' | 'female'
  ): { risk: number; pattern: string } {
    const affectedParents = parents.filter(p => 
      p.diseases.some(d => d.id === disease.id)
    );

    switch (disease.type) {
      case 'dominant':
        return this.calculateDominantRisk(affectedParents, parents);
      
      case 'recessive':
        return this.calculateRecessiveRisk(affectedParents, parents);
      
      case 'x-linked':
        return this.calculateXLinkedRisk(affectedParents, parents, childGender);
      
      case 'multifactorial':
        return this.calculateMultifactorialRisk(affectedParents, parents);
      
      default:
        return { risk: 0, pattern: 'unknown' };
    }
  }

  private static calculateDominantRisk(
    affectedParents: FamilyMember[],
    allParents: FamilyMember[]
  ): { risk: number; pattern: string } {
    if (affectedParents.length === 0) {
      return { risk: 0, pattern: 'no affected parents' };
    }
    
    // For dominant traits, one affected parent gives ~50% chance
    if (affectedParents.length === 1) {
      return { risk: 0.5, pattern: 'autosomal dominant (one parent)' };
    }
    
    // Both parents affected gives ~75% chance (assuming heterozygous)
    return { risk: 0.75, pattern: 'autosomal dominant (both parents)' };
  }

  private static calculateRecessiveRisk(
    affectedParents: FamilyMember[],
    allParents: FamilyMember[]
  ): { risk: number; pattern: string } {
    if (affectedParents.length === 0) {
      // Assume carrier frequency based on disease prevalence
      const carrierFreq = Math.sqrt(0.01); // Rough estimate
      return { risk: carrierFreq * 0.25, pattern: 'autosomal recessive (carrier risk)' };
    }
    
    if (affectedParents.length === 1) {
      // One affected parent, assume other is carrier
      return { risk: 0.5, pattern: 'autosomal recessive (one affected parent)' };
    }
    
    // Both parents affected
    return { risk: 1.0, pattern: 'autosomal recessive (both parents affected)' };
  }

  private static calculateXLinkedRisk(
    affectedParents: FamilyMember[],
    allParents: FamilyMember[],
    childGender: 'male' | 'female'
  ): { risk: number; pattern: string } {
    const affectedMother = affectedParents.find(p => p.gender === 'female');
    const affectedFather = affectedParents.find(p => p.gender === 'male');
    
    if (childGender === 'male') {
      if (affectedMother) {
        return { risk: 0.5, pattern: 'X-linked (affected mother, male child)' };
      }
      return { risk: 0, pattern: 'X-linked (male child, no affected mother)' };
    } else {
      // Female child
      if (affectedFather && affectedMother) {
        return { risk: 0.5, pattern: 'X-linked (both parents affected, female child)' };
      }
      if (affectedFather || affectedMother) {
        return { risk: 0.25, pattern: 'X-linked (one parent affected, female child)' };
      }
      return { risk: 0, pattern: 'X-linked (no affected parents, female child)' };
    }
  }

  private static calculateMultifactorialRisk(
    affectedParents: FamilyMember[],
    allParents: FamilyMember[]
  ): { risk: number; pattern: string } {
    const baseRisk = 0.05; // 5% base risk for multifactorial
    const riskMultiplier = 2.5; // Risk multiplier per affected parent
    
    const risk = baseRisk * Math.pow(riskMultiplier, affectedParents.length);
    
    return {
      risk: Math.min(risk, 0.8), // Cap at 80%
      pattern: `multifactorial (${affectedParents.length} affected parents)`
    };
  }

  /**
   * Combine multiple risk factors
   */
  private static combineRisks(risk1: number, risk2: number): number {
    // Use multiplicative model for combining risks
    return 1 - (1 - risk1) * (1 - risk2);
  }

  /**
   * Generate AI explanation for family risk patterns
   */
  static generateRiskExplanation(
    member: FamilyMember,
    disease: Disease,
    riskScore: number,
    familyMembers: FamilyMember[]
  ): string {
    const memberMap = new Map(familyMembers.map(m => [m.id, m]));
    const parents = member.parentIds
      .map(id => memberMap.get(id))
      .filter(Boolean) as FamilyMember[];
    
    const affectedParents = parents.filter(p => 
      p.diseases.some(d => d.id === disease.id)
    );

    let explanation = `${member.name} has a ${(riskScore * 100).toFixed(1)}% risk of developing ${disease.name}. `;

    if (affectedParents.length === 0) {
      explanation += `This is based on the general population risk since no parents are affected.`;
    } else if (affectedParents.length === 1) {
      explanation += `This elevated risk is due to having one affected parent (${affectedParents[0].name}). `;
    } else {
      explanation += `This high risk is due to both parents being affected. `;
    }

    explanation += ` The inheritance pattern for ${disease.name} is ${disease.type}.`;

    if (disease.type === 'x-linked' && member.gender === 'male') {
      explanation += ` As a male, ${member.name} would inherit the X chromosome from the mother, making the risk assessment particularly important.`;
    }

    return explanation;
  }
}
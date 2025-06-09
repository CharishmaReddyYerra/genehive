import { FamilyMember, Position3D, TreeLayoutConfig } from '../types';

export class TreeLayoutEngine {
  private static readonly DEFAULT_CONFIG: TreeLayoutConfig = {
    generationSpacing: 4,
    siblingSpacing: 3,
    branchSpacing: 2
  };

  /**
   * Calculate 3D positions for all family members
   */
  static calculateLayout(
    members: FamilyMember[],
    config: TreeLayoutConfig = TreeLayoutEngine.DEFAULT_CONFIG
  ): FamilyMember[] {
    const memberMap = new Map(members.map(m => [m.id, m]));
    const generations = this.organizeByGenerations(members, memberMap);
    
    // Calculate positions for each generation
    const positionedMembers = members.map(member => ({ ...member }));
    
    generations.forEach((generationMembers, generation) => {
      this.positionGeneration(
        generationMembers,
        generation,
        config,
        memberMap,
        positionedMembers
      );
    });

    return positionedMembers;
  }

  /**
   * Organize family members by generation
   */
  private static organizeByGenerations(
    members: FamilyMember[],
    memberMap: Map<string, FamilyMember>
  ): Map<number, FamilyMember[]> {
    const generations = new Map<number, FamilyMember[]>();
    const visited = new Set<string>();
    
    // Find root members (those with no parents)
    const roots = members.filter(m => m.parentIds.length === 0);
    
    // Assign generations using BFS
    const queue: { member: FamilyMember; generation: number }[] = 
      roots.map(member => ({ member, generation: 0 }));
    
    while (queue.length > 0) {
      const { member, generation } = queue.shift()!;
      
      if (visited.has(member.id)) continue;
      visited.add(member.id);
      
      member.generation = generation;
      
      if (!generations.has(generation)) {
        generations.set(generation, []);
      }
      generations.get(generation)!.push(member);
      
      // Add children to queue
      member.childrenIds.forEach(childId => {
        const child = memberMap.get(childId);
        if (child && !visited.has(childId)) {
          queue.push({ member: child, generation: generation + 1 });
        }
      });
    }
    
    return generations;
  }

  /**
   * Position members within a generation
   */
  private static positionGeneration(
    generationMembers: FamilyMember[],
    generation: number,
    config: TreeLayoutConfig,
    memberMap: Map<string, FamilyMember>,
    allMembers: FamilyMember[]
  ): void {
    // Group siblings together
    const siblingGroups = this.groupSiblings(generationMembers, memberMap);
    
    let currentX = 0;
    const y = -generation * config.generationSpacing;
    
    siblingGroups.forEach(siblings => {
      const groupWidth = (siblings.length - 1) * config.siblingSpacing;
      const startX = currentX - groupWidth / 2;
      
      siblings.forEach((member, index) => {
        const memberInAllMembers = allMembers.find(m => m.id === member.id);
        if (memberInAllMembers) {
          memberInAllMembers.position = {
            x: startX + index * config.siblingSpacing,
            y: y,
            z: this.calculateZPosition(member, memberMap)
          };
        }
      });
      
      currentX += groupWidth + config.branchSpacing;
    });
  }

  /**
   * Group siblings together
   */
  private static groupSiblings(
    members: FamilyMember[],
    memberMap: Map<string, FamilyMember>
  ): FamilyMember[][] {
    const groups: FamilyMember[][] = [];
    const processed = new Set<string>();
    
    members.forEach(member => {
      if (processed.has(member.id)) return;
      
      const siblings = this.findSiblings(member, members, memberMap);
      siblings.forEach(sibling => processed.add(sibling.id));
      groups.push(siblings);
    });
    
    return groups;
  }

  /**
   * Find all siblings of a given member
   */
  private static findSiblings(
    member: FamilyMember,
    generationMembers: FamilyMember[],
    memberMap: Map<string, FamilyMember>
  ): FamilyMember[] {
    if (member.parentIds.length === 0) {
      return [member]; // No parents, no siblings
    }
    
    return generationMembers.filter(other => 
      this.haveSameParents(member, other)
    );
  }

  /**
   * Check if two members have the same parents
   */
  private static haveSameParents(member1: FamilyMember, member2: FamilyMember): boolean {
    if (member1.parentIds.length !== member2.parentIds.length) {
      return false;
    }
    
    const parents1 = new Set(member1.parentIds);
    const parents2 = new Set(member2.parentIds);
    
    return parents1.size === parents2.size && 
           Array.from(parents1).every(id => parents2.has(id));
  }

  /**
   * Calculate Z position based on family branch
   */
  private static calculateZPosition(
    member: FamilyMember,
    memberMap: Map<string, FamilyMember>
  ): number {
    // Simple Z positioning based on family branch
    // Could be enhanced with more sophisticated algorithms
    const hash = this.hashString(member.id);
    return (hash % 5) - 2; // Range from -2 to 2
  }

  /**
   * Simple string hash function
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Optimize layout to minimize edge crossings
   */
  static optimizeLayout(members: FamilyMember[]): FamilyMember[] {
    // Simple optimization: sort siblings by number of descendants
    const optimized = members.map(member => ({ ...member }));
    const memberMap = new Map(optimized.map(m => [m.id, m]));
    
    // Group by generation and optimize each
    const generations = new Map<number, FamilyMember[]>();
    optimized.forEach(member => {
      if (!generations.has(member.generation)) {
        generations.set(member.generation, []);
      }
      generations.get(member.generation)!.push(member);
    });
    
    generations.forEach(generationMembers => {
      generationMembers.sort((a, b) => {
        const aDescendants = this.countDescendants(a, memberMap);
        const bDescendants = this.countDescendants(b, memberMap);
        return bDescendants - aDescendants;
      });
    });
    
    return optimized;
  }

  /**
   * Count total descendants of a member
   */
  private static countDescendants(
    member: FamilyMember,
    memberMap: Map<string, FamilyMember>
  ): number {
    let count = member.childrenIds.length;
    
    member.childrenIds.forEach(childId => {
      const child = memberMap.get(childId);
      if (child) {
        count += this.countDescendants(child, memberMap);
      }
    });
    
    return count;
  }

  /**
   * Calculate bounding box for the entire tree
   */
  static calculateBoundingBox(members: FamilyMember[]): {
    min: Position3D;
    max: Position3D;
    center: Position3D;
  } {
    if (members.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
        center: { x: 0, y: 0, z: 0 }
      };
    }
    
    const positions = members.map(m => m.position);
    
    const min: Position3D = {
      x: Math.min(...positions.map(p => p.x)),
      y: Math.min(...positions.map(p => p.y)),
      z: Math.min(...positions.map(p => p.z))
    };
    
    const max: Position3D = {
      x: Math.max(...positions.map(p => p.x)),
      y: Math.max(...positions.map(p => p.y)),
      z: Math.max(...positions.map(p => p.z))
    };
    
    const center: Position3D = {
      x: (min.x + max.x) / 2,
      y: (min.y + max.y) / 2,
      z: (min.z + max.z) / 2
    };
    
    return { min, max, center };
  }
}
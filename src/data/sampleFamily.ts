import { FamilyMember } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PREDEFINED_DISEASES } from './diseases';

export const createSampleFamily = (): FamilyMember[] => {
  const grandparentIds = {
    maternalGrandfather: uuidv4(),
    maternalGrandmother: uuidv4(),
    paternalGrandfather: uuidv4(),
    paternalGrandmother: uuidv4()
  };

  const parentIds = {
    mother: uuidv4(),
    father: uuidv4()
  };

  const childrenIds = {
    child1: uuidv4(),
    child2: uuidv4(),
    child3: uuidv4()
  };

  const members: FamilyMember[] = [
    // Grandparents (Generation 0)
    {
      id: grandparentIds.maternalGrandfather,
      name: 'Robert Johnson',
      age: 78,
      gender: 'male',
      parentIds: [],
      childrenIds: [parentIds.mother],
      diseases: [PREDEFINED_DISEASES.find(d => d.id === 'diabetes-t2')!],
      riskScores: {},
      position: { x: -6, y: 0, z: -1 },
      generation: 0
    },
    {
      id: grandparentIds.maternalGrandmother,
      name: 'Mary Johnson',
      age: 75,
      gender: 'female',
      parentIds: [],
      childrenIds: [parentIds.mother],
      diseases: [],
      riskScores: {},
      position: { x: -3, y: 0, z: -1 },
      generation: 0
    },
    {
      id: grandparentIds.paternalGrandfather,
      name: 'William Smith',
      age: 80,
      gender: 'male',
      parentIds: [],
      childrenIds: [parentIds.father],
      diseases: [
        PREDEFINED_DISEASES.find(d => d.id === 'heart-disease')!,
        PREDEFINED_DISEASES.find(d => d.id === 'hypertension')!
      ],
      riskScores: {},
      position: { x: 3, y: 0, z: 1 },
      generation: 0
    },
    {
      id: grandparentIds.paternalGrandmother,
      name: 'Elizabeth Smith',
      age: 77,
      gender: 'female',
      parentIds: [],
      childrenIds: [parentIds.father],
      diseases: [PREDEFINED_DISEASES.find(d => d.id === 'breast-cancer')!],
      riskScores: {},
      position: { x: 6, y: 0, z: 1 },
      generation: 0
    },

    // Parents (Generation 1)
    {
      id: parentIds.mother,
      name: 'Sarah Johnson-Smith',
      age: 45,
      gender: 'female',
      parentIds: [grandparentIds.maternalGrandfather, grandparentIds.maternalGrandmother],
      childrenIds: [childrenIds.child1, childrenIds.child2, childrenIds.child3],
      diseases: [PREDEFINED_DISEASES.find(d => d.id === 'diabetes-t2')!],
      riskScores: {},
      position: { x: -1.5, y: -4, z: 0 },
      generation: 1
    },
    {
      id: parentIds.father,
      name: 'Michael Smith',
      age: 47,
      gender: 'male',
      parentIds: [grandparentIds.paternalGrandfather, grandparentIds.paternalGrandmother],
      childrenIds: [childrenIds.child1, childrenIds.child2, childrenIds.child3],
      diseases: [],
      riskScores: {},
      position: { x: 1.5, y: -4, z: 0 },
      generation: 1
    },

    // Children (Generation 2)
    {
      id: childrenIds.child1,
      name: 'Emma Smith',
      age: 22,
      gender: 'female',
      parentIds: [parentIds.mother, parentIds.father],
      childrenIds: [],
      diseases: [],
      riskScores: {},
      position: { x: -3, y: -8, z: -0.5 },
      generation: 2
    },
    {
      id: childrenIds.child2,
      name: 'James Smith',
      age: 19,
      gender: 'male',
      parentIds: [parentIds.mother, parentIds.father],
      childrenIds: [],
      diseases: [],
      riskScores: {},
      position: { x: 0, y: -8, z: 0 },
      generation: 2
    },
    {
      id: childrenIds.child3,
      name: 'Olivia Smith',
      age: 16,
      gender: 'female',
      parentIds: [parentIds.mother, parentIds.father],
      childrenIds: [],
      diseases: [],
      riskScores: {},
      position: { x: 3, y: -8, z: 0.5 },
      generation: 2
    }
  ];

  return members;
};

export const createExtendedSampleFamily = (): FamilyMember[] => {
  const basicFamily = createSampleFamily();
  
  // Add some cousins and extended family
  const auntId = uuidv4();
  const uncleId = uuidv4();
  const cousin1Id = uuidv4();
  const cousin2Id = uuidv4();
  
  // Find the paternal grandparents
  const paternalGrandfather = basicFamily.find(m => m.name === 'William Smith')!;
  const paternalGrandmother = basicFamily.find(m => m.name === 'Elizabeth Smith')!;
  
  const extendedMembers: FamilyMember[] = [
    {
      id: auntId,
      name: 'Jennifer Smith-Wilson',
      age: 42,
      gender: 'female',
      parentIds: [paternalGrandfather.id, paternalGrandmother.id],
      childrenIds: [cousin1Id, cousin2Id],
      diseases: [PREDEFINED_DISEASES.find(d => d.id === 'breast-cancer')!],
      riskScores: {},
      position: { x: 8, y: -4, z: 1 },
      generation: 1
    },
    {
      id: uncleId,
      name: 'David Wilson',
      age: 44,
      gender: 'male',
      parentIds: [],
      childrenIds: [cousin1Id, cousin2Id],
      diseases: [],
      riskScores: {},
      position: { x: 11, y: -4, z: 1 },
      generation: 1
    },
    {
      id: cousin1Id,
      name: 'Sophie Wilson',
      age: 18,
      gender: 'female',
      parentIds: [auntId, uncleId],
      childrenIds: [],
      diseases: [],
      riskScores: {},
      position: { x: 8, y: -8, z: 1 },
      generation: 2
    },
    {
      id: cousin2Id,
      name: 'Lucas Wilson',
      age: 15,
      gender: 'male',
      parentIds: [auntId, uncleId],
      childrenIds: [],
      diseases: [],
      riskScores: {},
      position: { x: 11, y: -8, z: 1 },
      generation: 2
    }
  ];
  
  // Update the paternal grandparents' children
  paternalGrandfather.childrenIds.push(auntId);
  paternalGrandmother.childrenIds.push(auntId);
  
  return [...basicFamily, ...extendedMembers];
};

export const SAMPLE_FAMILY_SCENARIOS = {
  basic: {
    name: 'Nuclear Family',
    description: 'A basic three-generation family with diabetes and heart disease',
    getData: createSampleFamily
  },
  extended: {
    name: 'Extended Family',
    description: 'Includes cousins and shows breast cancer inheritance patterns',
    getData: createExtendedSampleFamily
  }
};
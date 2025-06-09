import { Disease } from '../types';

export const PREDEFINED_DISEASES: Disease[] = [
  {
    id: 'diabetes-t2',
    name: 'Type 2 Diabetes',
    type: 'multifactorial',
    prevalence: 0.11, // 11% population prevalence
    penetrance: 0.8,
    description: 'A metabolic disorder characterized by high blood sugar levels due to insulin resistance.',
    color: '#ef4444'
  },
  {
    id: 'heart-disease',
    name: 'Coronary Heart Disease',
    type: 'multifactorial',
    prevalence: 0.065, // 6.5% population prevalence
    penetrance: 0.7,
    description: 'A condition where the coronary arteries become narrowed or blocked.',
    color: '#dc2626'
  },
  {
    id: 'breast-cancer',
    name: 'Breast Cancer (BRCA)',
    type: 'dominant',
    prevalence: 0.125, // 12.5% lifetime risk for women
    penetrance: 0.65,
    description: 'Cancer that forms in the tissues of the breast, often linked to BRCA1/BRCA2 mutations.',
    color: '#f97316'
  },
  {
    id: 'huntingtons',
    name: "Huntington's Disease",
    type: 'dominant',
    prevalence: 0.00005, // 5 in 100,000
    penetrance: 1.0,
    description: 'A progressive brain disorder that causes uncontrolled movements and cognitive decline.',
    color: '#7c2d12'
  },
  {
    id: 'cystic-fibrosis',
    name: 'Cystic Fibrosis',
    type: 'recessive',
    prevalence: 0.0003, // 1 in 3,500 births
    penetrance: 1.0,
    description: 'A genetic disorder that affects the lungs and digestive system.',
    color: '#1d4ed8'
  },
  {
    id: 'sickle-cell',
    name: 'Sickle Cell Disease',
    type: 'recessive',
    prevalence: 0.0003, // Varies by ethnicity
    penetrance: 1.0,
    description: 'A group of blood disorders where red blood cells become misshapen and break down.',
    color: '#7c3aed'
  },
  {
    id: 'hemophilia-a',
    name: 'Hemophilia A',
    type: 'x-linked',
    prevalence: 0.00017, // 1 in 5,000 male births
    penetrance: 1.0,
    description: 'A bleeding disorder where blood cannot clot properly due to lack of clotting factor VIII.',
    color: '#059669'
  },
  {
    id: 'color-blindness',
    name: 'Red-Green Color Blindness',
    type: 'x-linked',
    prevalence: 0.08, // 8% of males, 0.5% of females
    penetrance: 1.0,
    description: 'Difficulty distinguishing between red and green colors.',
    color: '#0891b2'
  },
  {
    id: 'alzheimers',
    name: "Alzheimer's Disease",
    type: 'multifactorial',
    prevalence: 0.11, // 11% of people 65 and older
    penetrance: 0.6,
    description: 'A progressive neurologic disorder that causes brain cells to degenerate and die.',
    color: '#be185d'
  },
  {
    id: 'hypertension',
    name: 'Essential Hypertension',
    type: 'multifactorial',
    prevalence: 0.45, // 45% of adults
    penetrance: 0.75,
    description: 'High blood pressure with no identifiable cause, influenced by genetic and environmental factors.',
    color: '#c2410c'
  },
  {
    id: 'marfan',
    name: 'Marfan Syndrome',
    type: 'dominant',
    prevalence: 0.0002, // 1 in 5,000
    penetrance: 0.9,
    description: 'A connective tissue disorder that affects the heart, blood vessels, bones, and eyes.',
    color: '#0d9488'
  },
  {
    id: 'tay-sachs',
    name: 'Tay-Sachs Disease',
    type: 'recessive',
    prevalence: 0.000035, // 1 in 27,000 (higher in certain populations)
    penetrance: 1.0,
    description: 'A rare genetic disorder that progressively destroys nerve cells in the brain and spinal cord.',
    color: '#4338ca'
  }
];

export const DISEASE_CATEGORIES = {
  cardiovascular: ['heart-disease', 'hypertension'],
  metabolic: ['diabetes-t2'],
  cancer: ['breast-cancer'],
  neurological: ['huntingtons', 'alzheimers'],
  respiratory: ['cystic-fibrosis'],
  blood: ['sickle-cell', 'hemophilia-a'],
  sensory: ['color-blindness'],
  connective: ['marfan'],
  lysosomal: ['tay-sachs']
};

export const getDiseaseById = (id: string): Disease | undefined => {
  return PREDEFINED_DISEASES.find(disease => disease.id === id);
};

export const getDiseasesByCategory = (category: keyof typeof DISEASE_CATEGORIES): Disease[] => {
  const diseaseIds = DISEASE_CATEGORIES[category] || [];
  return diseaseIds.map(id => getDiseaseById(id)).filter(Boolean) as Disease[];
};

export const getInheritancePatternColor = (type: Disease['type']): string => {
  switch (type) {
    case 'dominant':
      return '#ef4444'; // Red
    case 'recessive':
      return '#3b82f6'; // Blue
    case 'x-linked':
      return '#10b981'; // Green
    case 'multifactorial':
      return '#f59e0b'; // Orange
    default:
      return '#6b7280'; // Gray
  }
};

export const getInheritancePatternDescription = (type: Disease['type']): string => {
  switch (type) {
    case 'dominant':
      return 'Only one copy of the gene variant is needed to cause the condition.';
    case 'recessive':
      return 'Two copies of the gene variant are needed to cause the condition.';
    case 'x-linked':
      return 'The gene variant is located on the X chromosome.';
    case 'multifactorial':
      return 'Caused by a combination of genetic and environmental factors.';
    default:
      return 'Unknown inheritance pattern.';
  }
};
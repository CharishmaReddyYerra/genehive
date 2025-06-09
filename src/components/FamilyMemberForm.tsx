import React, { useState, useEffect } from 'react';
import { FamilyMember, Disease } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PREDEFINED_DISEASES } from '../data/diseases';
import { Plus, X, User, Calendar, Users, Heart } from 'lucide-react';

interface FamilyMemberFormProps {
  member?: FamilyMember;
  existingMembers: FamilyMember[];
  onSave: (member: FamilyMember) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const FamilyMemberForm: React.FC<FamilyMemberFormProps> = ({
  member,
  existingMembers,
  onSave,
  onCancel,
  isOpen
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    age: number;
    gender: 'male' | 'female';
    parentIds: string[];
    diseaseIds: string[];
  }>({
    name: '',
    age: 0,
    gender: 'male',
    parentIds: [],
    diseaseIds: []
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDiseaseSelector, setShowDiseaseSelector] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        age: member.age,
        gender: member.gender,
        parentIds: member.parentIds,
        diseaseIds: member.diseases.map(d => d.id)
      });
    } else {
      setFormData({
        name: '',
        age: 0,
        gender: 'male',
        parentIds: [],
        diseaseIds: []
      });
    }
    setErrors({});
  }, [member, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.age < 0 || formData.age > 150) {
      newErrors.age = 'Age must be between 0 and 150';
    }

    if (formData.parentIds.length > 2) {
      newErrors.parents = 'A person cannot have more than 2 parents';
    }

    // Check for circular relationships
    if (member && formData.parentIds.includes(member.id)) {
      newErrors.parents = 'A person cannot be their own parent';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const selectedDiseases = PREDEFINED_DISEASES.filter(d => 
      formData.diseaseIds.includes(d.id)
    );

    const newMember: FamilyMember = {
      id: member?.id || uuidv4(),
      name: formData.name.trim(),
      age: formData.age,
      gender: formData.gender,
      parentIds: formData.parentIds,
      childrenIds: member?.childrenIds || [],
      diseases: selectedDiseases,
      riskScores: member?.riskScores || {},
      position: member?.position || { x: 0, y: 0, z: 0 },
      generation: member?.generation || 0
    };

    onSave(newMember);
  };

  const handleParentToggle = (parentId: string) => {
    setFormData(prev => ({
      ...prev,
      parentIds: prev.parentIds.includes(parentId)
        ? prev.parentIds.filter(id => id !== parentId)
        : [...prev.parentIds, parentId].slice(0, 2) // Max 2 parents
    }));
  };

  const handleDiseaseToggle = (diseaseId: string) => {
    setFormData(prev => ({
      ...prev,
      diseaseIds: prev.diseaseIds.includes(diseaseId)
        ? prev.diseaseIds.filter(id => id !== diseaseId)
        : [...prev.diseaseIds, diseaseId]
    }));
  };

  const availableParents = existingMembers.filter(m => 
    m.id !== member?.id && // Can't be parent of self
    !member?.childrenIds.includes(m.id) // Can't be parent of own child
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="w-6 h-6" />
              {member ? 'Edit Family Member' : 'Add Family Member'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Age *
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  className={`input ${errors.age ? 'border-red-500' : ''}`}
                  min="0"
                  max="150"
                  placeholder="Age"
                />
                {errors.age && (
                  <p className="text-red-500 text-sm mt-1">{errors.age}</p>
                )}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                    className="mr-2"
                  />
                  Male
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                    className="mr-2"
                  />
                  Female
                </label>
              </div>
            </div>

            {/* Parents */}
            {availableParents.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Parents (select up to 2)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {availableParents.map(parent => (
                    <label key={parent.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={formData.parentIds.includes(parent.id)}
                        onChange={() => handleParentToggle(parent.id)}
                        disabled={formData.parentIds.length >= 2 && !formData.parentIds.includes(parent.id)}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {parent.name} ({parent.gender}, {parent.age})
                      </span>
                    </label>
                  ))}
                </div>
                {errors.parents && (
                  <p className="text-red-500 text-sm mt-1">{errors.parents}</p>
                )}
              </div>
            )}

            {/* Diseases */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Heart className="w-4 h-4 inline mr-1" />
                  Known Conditions
                </label>
                <button
                  type="button"
                  onClick={() => setShowDiseaseSelector(!showDiseaseSelector)}
                  className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </button>
              </div>

              {/* Selected diseases */}
              {formData.diseaseIds.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {formData.diseaseIds.map(diseaseId => {
                      const disease = PREDEFINED_DISEASES.find(d => d.id === diseaseId);
                      if (!disease) return null;
                      return (
                        <span
                          key={diseaseId}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                          style={{ backgroundColor: disease.color + '20', color: disease.color }}
                        >
                          {disease.name}
                          <button
                            type="button"
                            onClick={() => handleDiseaseToggle(diseaseId)}
                            className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Disease selector */}
              {showDiseaseSelector && (
                <div className="border rounded-md p-3 bg-gray-50 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {PREDEFINED_DISEASES.map(disease => (
                      <label key={disease.id} className="flex items-center p-2 hover:bg-white rounded">
                        <input
                          type="checkbox"
                          checked={formData.diseaseIds.includes(disease.id)}
                          onChange={() => handleDiseaseToggle(disease.id)}
                          className="mr-2"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{disease.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{disease.type}</div>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full ml-2"
                          style={{ backgroundColor: disease.color }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary px-6 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-6 py-2"
              >
                {member ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FamilyMemberForm;
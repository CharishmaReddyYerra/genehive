import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FamilyMember, Disease } from '../types';
import { TrendingUp, Users, Activity, AlertTriangle } from 'lucide-react';

interface RiskTrendsPanelProps {
  familyMembers: FamilyMember[];
  diseases: Disease[];
  darkMode?: boolean;
}

const RiskTrendsPanel: React.FC<RiskTrendsPanelProps> = ({ familyMembers, diseases, darkMode = false }) => {
  // Calculate disease prevalence by generation
  const generationData = useMemo(() => {
    const generations = new Map<number, { total: number; diseases: Map<string, number> }>();
    
    familyMembers.forEach(member => {
      if (!generations.has(member.generation)) {
        generations.set(member.generation, { total: 0, diseases: new Map() });
      }
      
      const genData = generations.get(member.generation)!;
      genData.total++;
      
      member.diseases.forEach(disease => {
        const count = genData.diseases.get(disease.name) || 0;
        genData.diseases.set(disease.name, count + 1);
      });
    });
    
    return Array.from(generations.entries()).map(([gen, data]) => {
      const result: any = { generation: `Gen ${gen}`, total: data.total };
      diseases.forEach(disease => {
        const count = data.diseases.get(disease.name) || 0;
        result[disease.name] = ((count / data.total) * 100).toFixed(1);
      });
      return result;
    }).sort((a, b) => parseInt(a.generation.split(' ')[1]) - parseInt(b.generation.split(' ')[1]));
  }, [familyMembers, diseases]);

  // Calculate overall disease prevalence
  const diseasePrevalenceData = useMemo(() => {
    const diseaseCount = new Map<string, number>();
    
    familyMembers.forEach(member => {
      member.diseases.forEach(disease => {
        diseaseCount.set(disease.name, (diseaseCount.get(disease.name) || 0) + 1);
      });
    });
    
    return diseases.map(disease => ({
      name: disease.name,
      affected: diseaseCount.get(disease.name) || 0,
      percentage: familyMembers.length > 0 ? ((diseaseCount.get(disease.name) || 0) / familyMembers.length * 100).toFixed(1) : '0'
    })).filter(d => d.affected > 0);
  }, [familyMembers, diseases]);

  // Calculate age group risk distribution
  const ageGroupData = useMemo(() => {
    const ageGroups = {
      '0-20': { total: 0, withDiseases: 0 },
      '21-40': { total: 0, withDiseases: 0 },
      '41-60': { total: 0, withDiseases: 0 },
      '60+': { total: 0, withDiseases: 0 }
    };
    
    familyMembers.forEach(member => {
      let group: keyof typeof ageGroups;
      if (member.age <= 20) group = '0-20';
      else if (member.age <= 40) group = '21-40';
      else if (member.age <= 60) group = '41-60';
      else group = '60+';
      
      ageGroups[group].total++;
      if (member.diseases.length > 0) {
        ageGroups[group].withDiseases++;
      }
    });
    
    return Object.entries(ageGroups).map(([age, data]) => ({
      ageGroup: age,
      total: data.total,
      affected: data.withDiseases,
      percentage: data.total > 0 ? ((data.withDiseases / data.total) * 100).toFixed(1) : '0'
    }));
  }, [familyMembers]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  const chartTheme = {
    background: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#f3f4f6' : '#374151',
    grid: darkMode ? '#374151' : '#e5e7eb'
  };

  if (familyMembers.length === 0) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Data Available</h3>
        <p>Add family members to see risk trends and analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Users className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Members</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{familyMembers.length}</p>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Activity className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Affected Members</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {familyMembers.filter(m => m.diseases.length > 0).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-8 h-8 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unique Conditions</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {diseasePrevalenceData.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disease Prevalence by Generation */}
      <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Disease Prevalence by Generation
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={generationData}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis dataKey="generation" stroke={chartTheme.text} />
            <YAxis stroke={chartTheme.text} label={{ value: 'Prevalence (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: chartTheme.background, 
                border: `1px solid ${chartTheme.grid}`,
                color: chartTheme.text
              }} 
            />
            <Legend />
            {diseases.slice(0, 6).map((disease, index) => (
              <Bar 
                key={disease.id} 
                dataKey={disease.name} 
                fill={COLORS[index % COLORS.length]} 
                name={disease.name}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Overall Disease Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Disease Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={diseasePrevalenceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="affected"
              >
                {diseasePrevalenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: chartTheme.background, 
                  border: `1px solid ${chartTheme.grid}`,
                  color: chartTheme.text
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Age Group Analysis */}
        <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Risk by Age Group
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageGroupData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="ageGroup" stroke={chartTheme.text} />
              <YAxis stroke={chartTheme.text} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: chartTheme.background, 
                  border: `1px solid ${chartTheme.grid}`,
                  color: chartTheme.text
                }} 
              />
              <Bar dataKey="affected" fill="#8884d8" name="Affected Members" />
              <Bar dataKey="total" fill="#82ca9d" name="Total Members" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Detailed Disease Statistics
        </h3>
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className="text-left py-2 px-4">Disease</th>
                <th className="text-left py-2 px-4">Affected Members</th>
                <th className="text-left py-2 px-4">Family Prevalence</th>
                <th className="text-left py-2 px-4">Population Prevalence</th>
              </tr>
            </thead>
            <tbody>
              {diseasePrevalenceData.map((disease, index) => {
                const diseaseInfo = diseases.find(d => d.name === disease.name);
                return (
                  <tr key={index} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="py-2 px-4 font-medium">{disease.name}</td>
                    <td className="py-2 px-4">{disease.affected}</td>
                    <td className="py-2 px-4">{disease.percentage}%</td>
                    <td className="py-2 px-4">{diseaseInfo ? (diseaseInfo.prevalence * 100).toFixed(1) : 'N/A'}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskTrendsPanel;
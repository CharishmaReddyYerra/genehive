import React, { useRef } from 'react';
import { Download, FileText, Camera } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FamilyMember, Disease } from '../types';

interface ExportReportProps {
  familyMembers: FamilyMember[];
  diseases: Disease[];
  darkMode?: boolean;
  treeRef?: React.RefObject<HTMLDivElement>;
}

const ExportReport: React.FC<ExportReportProps> = ({ 
  familyMembers, 
  diseases, 
  darkMode = false,
  treeRef 
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const generatePDFReport = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GeneHive Family Health Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Family Summary
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Family Summary', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Family Members: ${familyMembers.length}`, 20, yPosition);
      yPosition += 6;
      
      const affectedMembers = familyMembers.filter(m => m.diseases.length > 0).length;
      pdf.text(`Members with Conditions: ${affectedMembers}`, 20, yPosition);
      yPosition += 6;
      
      const uniqueDiseases = new Set(familyMembers.flatMap(m => m.diseases.map(d => d.name))).size;
      pdf.text(`Unique Conditions in Family: ${uniqueDiseases}`, 20, yPosition);
      yPosition += 15;

      // Disease Statistics
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Disease Statistics', 20, yPosition);
      yPosition += 10;

      const diseaseStats = diseases.map(disease => {
        const affected = familyMembers.filter(m => 
          m.diseases.some(d => d.name === disease.name)
        ).length;
        const percentage = familyMembers.length > 0 ? (affected / familyMembers.length * 100).toFixed(1) : '0';
        return { name: disease.name, affected, percentage };
      }).filter(d => d.affected > 0);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      diseaseStats.forEach(stat => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${stat.name}: ${stat.affected} members (${stat.percentage}%)`, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 10;

      // Family Members List
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Family Members', 20, yPosition);
      yPosition += 10;

      familyMembers.forEach(member => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${member.name} (Age: ${member.age}, ${member.gender})`, 20, yPosition);
        yPosition += 6;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        if (member.diseases.length > 0) {
          pdf.text(`Conditions: ${member.diseases.map(d => d.name).join(', ')}`, 25, yPosition);
          yPosition += 5;
        }
        
        if (member.riskScores && Object.keys(member.riskScores).length > 0) {
          const maxRiskScore = Math.max(...Object.values(member.riskScores));
          pdf.text(`Risk Score: ${(maxRiskScore * 100).toFixed(1)}%`, 25, yPosition);
          yPosition += 5;
        }
        
        yPosition += 3;
      });

      // Add 3D Tree Screenshot if available
      if (treeRef?.current) {
        try {
          const canvas = await html2canvas(treeRef.current, {
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            scale: 0.5
          });
          
          pdf.addPage();
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Family Tree Visualization', 20, 20);
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (imgHeight <= pageHeight - 40) {
            pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
          } else {
            const scaledHeight = pageHeight - 40;
            const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
            pdf.addImage(imgData, 'PNG', 20, 30, scaledWidth, scaledHeight);
          }
        } catch (error) {
          console.warn('Could not capture family tree image:', error);
        }
      }

      // Disclaimer
      pdf.addPage();
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Important Disclaimer', 20, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const disclaimerText = [
        'This report is generated based on family history information provided and should not be',
        'considered as medical advice or diagnosis. The risk calculations are estimates based on',
        'family patterns and may not reflect actual medical risk.',
        '',
        'Please consult with qualified healthcare professionals and genetic counselors for:',
        '• Professional risk assessment',
        '• Genetic testing recommendations',
        '• Medical screening guidelines',
        '• Treatment and prevention strategies',
        '',
        'This tool is for informational purposes only and does not replace professional medical care.'
      ];
      
      let disclaimerY = 35;
      disclaimerText.forEach(line => {
        pdf.text(line, 20, disclaimerY);
        disclaimerY += 6;
      });

      // Save the PDF
      pdf.save(`GeneHive_Family_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const exportTreeImage = async () => {
    if (!treeRef?.current) {
      alert('Family tree not available for export.');
      return;
    }

    try {
      const canvas = await html2canvas(treeRef.current, {
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        scale: 1
      });
      
      const link = document.createElement('a');
      link.download = `GeneHive_Family_Tree_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting tree image:', error);
      alert('Error exporting family tree image. Please try again.');
    }
  };

  const exportDataJSON = () => {
    const exportData = {
      familyMembers,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `GeneHive_Data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={generatePDFReport}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          darkMode
            ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
            : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
        }`}
        title="Export comprehensive PDF report"
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm font-medium">Export Report</span>
      </button>

      <button
        onClick={exportTreeImage}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          darkMode
            ? 'bg-green-600 border-green-500 text-white hover:bg-green-700'
            : 'bg-green-600 border-green-500 text-white hover:bg-green-700'
        }`}
        title="Export family tree as image"
      >
        <Camera className="w-4 h-4" />
        <span className="text-sm font-medium">Export Tree</span>
      </button>

      <button
        onClick={exportDataJSON}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          darkMode
            ? 'bg-gray-600 border-gray-500 text-white hover:bg-gray-700'
            : 'bg-gray-600 border-gray-500 text-white hover:bg-gray-700'
        }`}
        title="Export raw data as JSON"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">Export Data</span>
      </button>
    </div>
  );
};

export default ExportReport;
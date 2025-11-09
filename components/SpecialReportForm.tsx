import React, { useState, useMemo } from 'react';
import { SpecialReport, Teacher, GeneralCriterion } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { exportToTxt, exportToPdf, exportToExcel, sendToWhatsApp } from '../lib/exportUtils';

interface SpecialReportFormProps {
  report: SpecialReport;
  teacher: Teacher;
  onSave: (report: SpecialReport) => void;
  onCancel: () => void;
}

const SpecialReportForm: React.FC<SpecialReportFormProps> = ({ report, teacher, onSave, onCancel }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<SpecialReport>(report);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCriterionChange = (index: number, score: 0 | 1 | 2 | 3 | 4) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index] = { ...newCriteria[index], score };
    setFormData(prev => ({ ...prev, criteria: newCriteria }));
  };

  const getScoreColor = (score: number) => {
    switch(score) {
      case 1: return 'bg-warning text-white border-warning';
      case 2: return 'bg-light-yellow text-gray-800 border-light-yellow';
      case 3: return 'bg-blue-500 text-white border-blue-500';
      case 4: return 'bg-green-500 text-white border-green-500';
      default: return 'bg-gray-200 border-gray-300 hover:bg-gray-300';
    }
  };
  
  const getScoreFeedback = (score: number): string => {
    const key = `score_${score}` as keyof ReturnType<typeof useLanguage>['t'];
    return t(key as any);
  };

  const totalPercentage = useMemo(() => {
    if (formData.criteria.length === 0) return 0;
    const totalScore = formData.criteria.reduce((sum, c) => sum + c.score, 0);
    const maxScore = formData.criteria.length * 4;
    if (maxScore === 0) return 0;
    return (totalScore / maxScore) * 100;
  }, [formData.criteria]);

  const getPerformanceStyles = (percentage: number): { className: string, text: string } => {
    if (percentage <= 30) return { className: 'bg-red-800 text-white', text: t('percentage_0_30') };
    if (percentage <= 40) return { className: 'bg-red-500 text-white', text: t('percentage_31_40') };
    if (percentage <= 60) return { className: 'bg-yellow-300 text-gray-800', text: t('percentage_41_60') };
    if (percentage <= 74) return { className: 'bg-yellow-500 text-white', text: t('percentage_61_74') };
    if (percentage <= 80) return { className: 'bg-sky-400 text-white', text: t('percentage_75_80') };
    if (percentage <= 89) return { className: 'bg-sky-600 text-white', text: t('percentage_81_89') };
    return { className: 'bg-green-500 text-white', text: t('percentage_90_100') };
  };
  
  const performanceStyle = getPerformanceStyles(totalPercentage);

  return (
    <div className="p-4 md:p-6 rounded-lg shadow-md space-y-6" style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}>
      <h2 className="text-2xl font-bold text-primary">{formData.templateName} - {teacher.name}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="p-2 border rounded focus:ring-primary focus:border-primary transition bg-inherit" />
        <input type="text" name="school" placeholder={t('schoolName')} value={formData.school} onChange={handleInputChange} className="p-2 border rounded focus:ring-primary focus:border-primary transition bg-inherit" readOnly />
        <input type="text" name="subject" placeholder={t('subject')} value={formData.subject} onChange={handleInputChange} className="p-2 border rounded focus:ring-primary focus:border-primary transition bg-inherit" />
        <input type="text" name="grades" placeholder={t('grades')} value={formData.grades} onChange={handleInputChange} className="p-2 border rounded focus:ring-primary focus:border-primary transition bg-inherit" />
        <select name="branch" value={formData.branch} onChange={handleInputChange} className="p-2 border rounded focus:ring-primary focus:border-primary transition bg-inherit">
          <option value="main">{t('mainBranch')}</option>
          <option value="boys">{t('boysBranch')}</option>
          <option value="girls">{t('girlsBranch')}</option>
        </select>
      </div>

      <div className="border-t pt-4" style={{ borderColor: 'var(--color-card-border)' }}>
        <h3 className="text-xl font-semibold mb-4 text-primary">{t('criteria')}</h3>
        <div className="space-y-4">
          {formData.criteria.map((criterion, index) => (
            <div key={criterion.id} className="p-3 bg-opacity-50 rounded-md flex flex-col md:flex-row items-center gap-4 border-b" style={{ backgroundColor: 'rgba(128,128,128,0.05)', borderColor: 'var(--color-card-border)'}}>
              <div className="flex-grow flex items-center">
                <label className="font-medium">{criterion.label}</label>
                 <span className="text-sm text-gray-500 ms-2 rtl:me-2">({getScoreFeedback(criterion.score)})</span>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {[1, 2, 3, 4].map(score => (
                  <button key={score} onClick={() => handleCriterionChange(index, score as 1|2|3|4)} className={`w-10 h-10 rounded-full font-bold border-2 transition-transform transform hover:scale-110 ${criterion.score === score ? getScoreColor(score) : 'bg-gray-200 border-gray-300'}`}>
                    {score}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={`text-center p-4 rounded-lg transition-colors duration-500 ${performanceStyle.className}`}>
        <h4 className="text-lg font-bold">{t('totalPercentage')}: <span className="text-2xl">{totalPercentage.toFixed(2)}%</span></h4>
        <p className="font-semibold mt-1">{performanceStyle.text}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-card-border)' }}>
        <button onClick={() => onSave(formData)} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-105">{t('save')}</button>
        <button onClick={onCancel} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all transform hover:scale-105">{t('cancel')}</button>
        <button onClick={() => exportToTxt(formData, teacher)} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all transform hover:scale-105">{t('exportTxt')}</button>
        <button onClick={() => exportToPdf(formData, teacher)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all transform hover:scale-105">{t('exportPdf')}</button>
        <button onClick={() => exportToExcel(formData, teacher)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all transform hover:scale-105">{t('exportExcel')}</button>
        <button onClick={() => sendToWhatsApp(formData, teacher)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all transform hover:scale-105">{t('sendToWhatsApp')}</button>
      </div>
    </div>
  );
};

export default SpecialReportForm;

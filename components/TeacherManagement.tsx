import React, { useState } from 'react';
import { Teacher, Report, CustomCriterion, SpecialReportTemplate, Syllabus, GeneralCriterion } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import TeacherList from './TeacherList';
import ReportView from './ReportView';
import AggregatedReports from './AggregatedReports';
import PerformanceDashboard from './PerformanceDashboard';

interface TeacherManagementProps {
  teachers: Teacher[];
  reports: Report[];
  customCriteria: CustomCriterion[];
  specialReportTemplates: SpecialReportTemplate[];
  syllabi: Syllabus[];
  selectedSchool: string;
  addTeacher: (name: string, schoolName: string) => void;
  updateTeacher: (teacher: Teacher) => void;
  deleteTeacher: (teacherId: string) => void;
  saveReport: (report: Report) => void;
  deleteReport: (reportId: string) => void;
  addCustomCriterion: (criterion: CustomCriterion) => void;
  saveSpecialReportTemplate: (template: SpecialReportTemplate) => void;
  deleteSpecialReportTemplate: (templateId: string) => void;
  saveSyllabus: (syllabus: Syllabus) => void;
  deleteSyllabus: (syllabusId: string) => void;
}

type View = 'teachers' | 'aggregated_reports' | 'performance_dashboard' | 'special_reports' | 'syllabus';

const TeacherManagement: React.FC<TeacherManagementProps> = (props) => {
  const { 
    teachers, reports, customCriteria, specialReportTemplates, syllabi, selectedSchool,
    addTeacher, updateTeacher, deleteTeacher, saveReport, deleteReport, addCustomCriterion,
    saveSpecialReportTemplate, deleteSpecialReportTemplate, saveSyllabus, deleteSyllabus
  } = props;

  const { t } = useLanguage();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [activeView, setActiveView] = useState<View>('teachers');
  
  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setActiveView('teachers');
  };

  const handleBackToList = () => {
    setSelectedTeacher(null);
  };
  
  // Special Reports Manager Component Logic
  const SpecialReportsManager = () => {
      const [editingTemplate, setEditingTemplate] = useState<SpecialReportTemplate | null>(null);

      const handleNewTemplate = () => {
          setEditingTemplate({
              id: `srt-${Date.now()}`,
              schoolName: selectedSchool,
              name: '',
              criteria: [],
              placement: 'teacher_reports'
          });
      };
      
      const handleSaveTemplate = (template: SpecialReportTemplate) => {
          saveSpecialReportTemplate(template);
          setEditingTemplate(null);
      };
      
      const addCriterionToTemplate = (template: SpecialReportTemplate) => {
          const newCriterionName = window.prompt(t('criterionName'));
          if(newCriterionName?.trim()){
              const newCriterion: Omit<GeneralCriterion, 'score'> = {
                  id: `scrit-${Date.now()}`,
                  label: newCriterionName.trim(),
              };
              setEditingTemplate({...template, criteria: [...template.criteria, newCriterion]});
          }
      };
      
      const removeCriterionFromTemplate = (template: SpecialReportTemplate, critId: string) => {
          setEditingTemplate({...template, criteria: template.criteria.filter(c => c.id !== critId)});
      };

      if (editingTemplate) {
          return (
              <div className="p-6 bg-white rounded-lg shadow-lg space-y-4">
                  <h3 className="text-xl font-bold text-primary">{t('newSpecialReportTemplate')}</h3>
                  <input type="text" placeholder={t('templateName')} value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} className="w-full p-2 border rounded" />
                  <select value={editingTemplate.placement} onChange={e => setEditingTemplate({...editingTemplate, placement: e.target.value as any})} className="w-full p-2 border rounded">
                      <option value="teacher_reports">{t('placementInTeacherReports')}</option>
                      {/* <option value="main">{t('placementInMainScreen')}</option> */}
                  </select>
                  <div className="space-y-2">
                      <h4 className="font-semibold">{t('criteria')}</h4>
                      {editingTemplate.criteria.map(c => <div key={c.id} className="flex justify-between items-center p-2 bg-gray-100 rounded"><span>{c.label}</span><button onClick={() => removeCriterionFromTemplate(editingTemplate, c.id)} className="text-red-500">X</button></div>)}
                      <button onClick={() => addCriterionToTemplate(editingTemplate)} className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">+ {t('addNewCriterion')}</button>
                  </div>
                  <div className="flex gap-4">
                      <button onClick={() => handleSaveTemplate(editingTemplate)} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">{t('saveTemplate')}</button>
                      <button onClick={() => setEditingTemplate(null)} className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">{t('cancel')}</button>
                  </div>
              </div>
          )
      }

      return (
           <div className="p-6 bg-white rounded-lg shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-primary">{t('specialReports')}</h2>
                  <button onClick={handleNewTemplate} className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-colors">+ {t('newSpecialReportTemplate')}</button>
              </div>
              {specialReportTemplates.length === 0 ? <p>{t('noSpecialTemplates')}</p> :
                  specialReportTemplates.map(template => (
                      <div key={template.id} className="p-3 border rounded flex justify-between items-center">
                          <span className="font-semibold">{template.name}</span>
                          <div>
                              <button onClick={() => setEditingTemplate(template)} className="text-blue-500 p-2">{t('edit')}</button>
                              <button onClick={() => window.confirm(t('confirmDelete')) && deleteSpecialReportTemplate(template.id)} className="text-red-500 p-2">{t('delete')}</button>
                          </div>
                      </div>
                  ))
              }
          </div>
      )
  };
  
  // Syllabus Manager Component Logic
  const SyllabusManager = () => {
    const [newSyllabus, setNewSyllabus] = useState<{subject: string; grade: string; topics: string} | null>(null);

    const handleSave = () => {
        if (newSyllabus && newSyllabus.subject.trim() && newSyllabus.grade.trim()) {
            saveSyllabus({
                id: `syl-${Date.now()}`,
                schoolName: selectedSchool,
                ...newSyllabus
            });
            setNewSyllabus(null);
        }
    };
    
    return (
        <div className="p-6 bg-white rounded-lg shadow-lg space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-primary">{t('syllabusProgress')}</h2>
                <button onClick={() => setNewSyllabus({subject: '', grade: '', topics: ''})} className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-colors">+ {t('addNewSyllabus')}</button>
            </div>
            
            {newSyllabus && (
                <div className="p-4 border rounded space-y-3">
                    <input type="text" placeholder={t('subject')} value={newSyllabus.subject} onChange={e => setNewSyllabus({...newSyllabus, subject: e.target.value})} className="w-full p-2 border rounded" />
                    <input type="text" placeholder={t('grade')} value={newSyllabus.grade} onChange={e => setNewSyllabus({...newSyllabus, grade: e.target.value})} className="w-full p-2 border rounded" />
                    <textarea placeholder={t('topics')} value={newSyllabus.topics} onChange={e => setNewSyllabus({...newSyllabus, topics: e.target.value})} className="w-full p-2 border rounded h-32" />
                     <div className="flex gap-4">
                      <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">{t('saveSyllabus')}</button>
                      <button onClick={() => setNewSyllabus(null)} className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">{t('cancel')}</button>
                  </div>
                </div>
            )}

            <div className="space-y-3">
                {syllabi.map(s => (
                    <div key={s.id} className="p-4 border rounded">
                        <div className="flex justify-between items-start">
                           <div>
                             <h4 className="font-bold text-lg">{s.subject} - {s.grade}</h4>
                             <p className="whitespace-pre-wrap text-gray-600 mt-2">{s.topics}</p>
                           </div>
                           <button onClick={() => window.confirm(t('confirmDelete')) && deleteSyllabus(s.id)} className="text-red-500 p-2 text-sm">{t('delete')}</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };


  const renderView = () => {
    switch (activeView) {
      case 'aggregated_reports':
        return <AggregatedReports reports={reports} teachers={teachers} />;
      case 'performance_dashboard':
        return <PerformanceDashboard reports={reports} teachers={teachers} />;
      case 'special_reports':
        return <SpecialReportsManager />;
      case 'syllabus':
          return <SyllabusManager />;
      case 'teachers':
      default:
        if (selectedTeacher) {
          return <ReportView 
                    teacher={selectedTeacher} 
                    reports={reports.filter(r => r.teacherId === selectedTeacher.id)} 
                    customCriteria={customCriteria.filter(c => c.school === selectedSchool)}
                    specialReportTemplates={specialReportTemplates.filter(t => t.placement === 'teacher_reports')}
                    onBack={handleBackToList} 
                    saveReport={saveReport} 
                    deleteReport={deleteReport} 
                    updateTeacher={updateTeacher} 
                    addCustomCriterion={addCustomCriterion}
                 />;
        }
        return <TeacherList teachers={teachers} onSelectTeacher={handleSelectTeacher} addTeacher={(name) => addTeacher(name, selectedSchool)} deleteTeacher={deleteTeacher} updateTeacher={updateTeacher} />;
    }
  };

  const getButtonClass = (view: View) => {
    return `px-5 py-2.5 rounded-lg font-bold transition-all text-sm md:text-base transform hover:scale-105 ${activeView === view ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'}`;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <button onClick={() => { setActiveView('teachers'); setSelectedTeacher(null); }} className={getButtonClass('teachers')}>
          {t('manageTeachersAndReports')}
        </button>
        <button onClick={() => { setActiveView('aggregated_reports'); setSelectedTeacher(null); }} className={getButtonClass('aggregated_reports')}>
          {t('aggregatedReports')}
        </button>
        <button onClick={() => { setActiveView('performance_dashboard'); setSelectedTeacher(null); }} className={getButtonClass('performance_dashboard')}>
          {t('performanceIndicators')}
        </button>
        <button onClick={() => { setActiveView('special_reports'); setSelectedTeacher(null); }} className={getButtonClass('special_reports')}>
          {t('specialReports')}
        </button>
        <button onClick={() => { setActiveView('syllabus'); setSelectedTeacher(null); }} className={getButtonClass('syllabus')}>
          {t('syllabusProgress')}
        </button>
      </div>
      {renderView()}
    </div>
  );
};

export default TeacherManagement;

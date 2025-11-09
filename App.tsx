import React, { useState, useMemo, useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { translations } from './i18n/translations';
import Header from './components/Header';
import Footer from './components/Footer';
import TeacherManagement from './components/TeacherManagement';
import { Teacher, Report, CustomCriterion, School, SpecialReportTemplate, Syllabus } from './types';
import { INITIAL_TEACHERS, THEMES, INITIAL_SCHOOLS } from './constants';
import useLocalStorage from './hooks/useLocalStorage';

const App: React.FC = () => {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useLocalStorage<string>('theme', 'default');
  
  // Multi-school state
  const [schools, setSchools] = useLocalStorage<School[]>('schools', INITIAL_SCHOOLS);
  const [selectedSchool, setSelectedSchool] = useLocalStorage<string | null>('selectedSchool', null);

  // Data states
  const [teachers, setTeachers] = useLocalStorage<Teacher[]>('teachers', INITIAL_TEACHERS);
  const [reports, setReports] = useLocalStorage<Report[]>('reports', []);
  const [customCriteria, setCustomCriteria] = useLocalStorage<CustomCriterion[]>('customCriteria', []);
  const [specialReportTemplates, setSpecialReportTemplates] = useLocalStorage<SpecialReportTemplate[]>('specialReportTemplates', []);
  const [syllabi, setSyllabi] = useLocalStorage<Syllabus[]>('syllabi', []);


  useEffect(() => {
    const themeConfig = THEMES[theme as keyof typeof THEMES] || THEMES.default;
    const themeColors = themeConfig.colors;
    for (const key in themeColors) {
      document.documentElement.style.setProperty(key, themeColors[key as keyof typeof themeColors]);
    }
  }, [theme]);


  const t = useMemo(() => {
    return (key: keyof typeof translations.ar) => {
      return translations[language][key] || key;
    };
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const addSchool = (name: string) => {
      const newSchool: School = { id: `school-${Date.now()}`, name };
      setSchools(prev => [...prev, newSchool]);
      setSelectedSchool(name);
  };

  const addTeacher = (name: string, schoolName: string) => {
    const newTeacher: Teacher = {
      id: `teacher-${Date.now()}`,
      name,
      schoolName,
    };
    setTeachers(prev => [...prev, newTeacher]);
  };
  
  const updateTeacher = (updatedTeacher: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === updatedTeacher.id ? updatedTeacher : t));
  };

  const deleteTeacher = (teacherId: string) => {
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
    setReports(prev => prev.filter(r => r.teacherId !== teacherId));
  };

  const saveReport = (report: Report) => {
    setReports(prev => {
      const existingIndex = prev.findIndex(r => r.id === report.id);
      if (existingIndex > -1) {
        const updatedReports = [...prev];
        updatedReports[existingIndex] = report;
        return updatedReports;
      }
      return [...prev, report];
    });
  };

  const deleteReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const addCustomCriterion = (criterion: CustomCriterion) => {
    setCustomCriteria(prev => [...prev, criterion]);
  };

  const saveSpecialReportTemplate = (template: SpecialReportTemplate) => {
      setSpecialReportTemplates(prev => {
          const index = prev.findIndex(t => t.id === template.id);
          if (index > -1) {
              const updated = [...prev];
              updated[index] = template;
              return updated;
          }
          return [...prev, template];
      });
  };
  
  const deleteSpecialReportTemplate = (templateId: string) => {
      setSpecialReportTemplates(prev => prev.filter(t => t.id !== templateId));
  };
  
  const saveSyllabus = (syllabus: Syllabus) => {
       setSyllabi(prev => {
          const index = prev.findIndex(s => s.id === syllabus.id);
          if (index > -1) {
              const updated = [...prev];
              updated[index] = syllabus;
              return updated;
          }
          return [...prev, syllabus];
      });
  };

  const deleteSyllabus = (syllabusId: string) => {
      setSyllabi(prev => prev.filter(s => s.id !== syllabusId));
  };

  // School Selector Component
  const SchoolSelector = () => {
      const [newSchoolName, setNewSchoolName] = useState('');

      const handleAdd = () => {
          if (newSchoolName.trim()) {
              addSchool(newSchoolName.trim());
              setNewSchoolName('');
          }
      };

      return (
          <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
                  <h2 className="text-2xl font-bold text-primary mb-6">{t('selectSchool')}</h2>
                  <div className="space-y-3 mb-6">
                      {schools.map(school => (
                          <button key={school.id} onClick={() => setSelectedSchool(school.name)} className="w-full p-4 bg-primary text-white font-bold rounded-lg text-lg hover:bg-opacity-90 transition-all transform hover:scale-105">
                              {school.name}
                          </button>
                      ))}
                  </div>
                  <div className="border-t pt-4">
                       <h3 className="text-lg font-semibold mb-3 text-gray-700">{t('addSchool')}</h3>
                       <div className="flex gap-3">
                            <input type="text" placeholder={t('schoolName')} value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} className="flex-grow p-3 border rounded-lg focus:ring-primary focus:border-primary" />
                            <button onClick={handleAdd} className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors transform hover:scale-105">{t('add')}</button>
                       </div>
                  </div>
              </div>
          </div>
      )
  };

  // Filter data based on selected school
  const schoolFilteredTeachers = teachers.filter(t => t.schoolName === selectedSchool);
  const schoolFilteredReports = reports.filter(r => {
      const teacher = teachers.find(t => t.id === r.teacherId);
      return teacher && teacher.schoolName === selectedSchool;
  });
  const schoolFilteredCustomCriteria = customCriteria.filter(c => c.school === selectedSchool);
  const schoolFilteredSpecialReportTemplates = specialReportTemplates.filter(t => t.schoolName === selectedSchool);
  const schoolFilteredSyllabi = syllabi.filter(s => s.schoolName === selectedSchool);

  return (
    <LanguageProvider value={{ language, t, toggleLanguage }}>
      <div className={`min-h-screen font-sans ${language === 'ar' ? 'rtl' : 'ltr'}`}>
        {!selectedSchool && <SchoolSelector />}
        <Header 
            currentTheme={theme} 
            setTheme={setTheme} 
            selectedSchool={selectedSchool}
            onChangeSchool={() => setSelectedSchool(null)}
        />
        {selectedSchool && (
            <main className="container mx-auto p-4 md:p-6">
              <TeacherManagement 
                teachers={schoolFilteredTeachers} 
                reports={schoolFilteredReports}
                customCriteria={schoolFilteredCustomCriteria}
                specialReportTemplates={schoolFilteredSpecialReportTemplates}
                syllabi={schoolFilteredSyllabi}
                selectedSchool={selectedSchool}
                addTeacher={addTeacher}
                updateTeacher={updateTeacher}
                deleteTeacher={deleteTeacher}
                saveReport={saveReport}
                deleteReport={deleteReport}
                addCustomCriterion={addCustomCriterion}
                saveSpecialReportTemplate={saveSpecialReportTemplate}
                deleteSpecialReportTemplate={deleteSpecialReportTemplate}
                saveSyllabus={saveSyllabus}
                deleteSyllabus={deleteSyllabus}
              />
            </main>
        )}
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default App;

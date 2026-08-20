import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

const AdminImport: React.FC = () => {
  const navigate = useNavigate();
  const storedUser = getStoredUser();

  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showFormat, setShowFormat] = useState(false);

  useEffect(() => {
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [storedUser, navigate]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFile(dropped);
  };

  const handleFile = (f: File) => {
    setError('');
    setResult(null);
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are allowed');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }
    setFile(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      const res = await fetchJSON('/admin/import-csv', {
        method: 'POST',
        body: formData,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadSample = () => {
    const sample = `name,email,collegeName,department,year,skills,offerSkills,wantedSkills,courseTitle,courseDescription,courseCategory,courseLevel,courseDuration,courseObjectives,modules,notes,resources,videoLinks,referenceLinks,liveClassLinks,assignmentLinks,quizLinks
Aarav Sharma,aarav@example.com,Engineering,Computer Science,2,Python,Python Programming,Data Science,Python Programming,Learn Python basics and advanced topics,Technology,Intermediate,8 weeks,Master Python programming,Module 1\\nModule 2,Module 1 notes,Resource link,https://www.youtube.com/watch?v=dQw4w9WgXcQ,https://docs.python.org,https://meet.google.com/abc,https://github.com/example/python,https://quiz.example.com
Priya Singh,priya@example.com,Science,Physics,1,Math,Mathematics,Calculus,Mathematics Fundamentals,Calculus and Linear Algebra,Academics,Intermediate,6 weeks,Strong foundation in math,Module 1\\nModule 2,Math notes,,https://www.youtube.com/watch?v=xyz,,,,
Rahul Verma,rahul@example.com,Engineering,IT,3,Web Development,React Development,Node.js,React Development,Build modern web apps,Technology,Advanced,10 weeks,Full-stack React course,Module 1\\nModule 2\\nModule 3,React notes,https://react.dev,https://www.youtube.com/watch?v=abc,https://github.com/react,https://meet.google.com/def,,`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_import.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!storedUser || storedUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Import Student Data</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Bulk import students, skills, and optional course information using CSV.
            </p>
          </div>

          {/* Upload Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8 mb-6">
            {!file ? (
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 ${
                  dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-5xl mb-4">📁</div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Drag and drop your CSV file here
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  or click to browse
                </p>
                <p className="text-xs text-slate-400">
                  Supported format: .csv (max 5MB)
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setFile(null); setResult(null); setError(''); }}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl">
                    {error}
                  </div>
                )}

                {result && (
                  <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Import Completed Successfully
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-indigo-600">{result.usersCreated}</p>
                        <p className="text-xs text-slate-500">Users Created</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">{result.usersSkipped}</p>
                        <p className="text-xs text-slate-500">Users Skipped</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{result.skillsCreated + result.coursesCreated}</p>
                        <p className="text-xs text-slate-500">Skills/Courses Created</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{result.totalRecords}</p>
                        <p className="text-xs text-slate-500">Total Records</p>
                      </div>
                    </div>

                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                          {result.errors.length} error{result.errors.length !== 1 ? 's' : ''} found
                        </p>
                        <div className="max-h-60 overflow-y-auto border border-red-200 dark:border-red-800 rounded-xl">
                          <table className="w-full text-sm">
                            <thead className="bg-red-50 dark:bg-red-900/30">
                              <tr>
                                <th className="px-4 py-2 text-left text-red-700 dark:text-red-300 font-medium">Row</th>
                                <th className="px-4 py-2 text-left text-red-700 dark:text-red-300 font-medium">Error</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.errors.map((err: string, idx: number) => {
                                const rowMatch = err.match(/Row\s+(\d+):\s*(.*)/);
                                const rowNum = rowMatch ? rowMatch[1] : '-';
                                const msg = rowMatch ? rowMatch[2] : err;
                                return (
                                  <tr key={idx} className="border-t border-red-200 dark:border-red-800">
                                    <td className="px-4 py-2 text-red-800 dark:text-red-300 font-mono">{rowNum}</td>
                                    <td className="px-4 py-2 text-red-700 dark:text-red-300">{msg}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => { setFile(null); setResult(null); setError(''); }}
                      className="mt-3 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      Import Another File
                    </button>
                  </div>
                )}

                {!result && (
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl hover:from-indigo-500 hover:to-purple-500 hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {importing ? (
                      <>
                        <span className="animate-spin text-lg">⏳</span>
                        <span>Importing CSV...</span>
                      </>
                    ) : (
                      <>
                        <span>📥</span>
                        <span>Import CSV</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CSV Format Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
            <button
              onClick={() => setShowFormat(!showFormat)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📋</span>
                <span className="font-semibold text-slate-900 dark:text-white">CSV Format</span>
              </div>
              <span className={`text-slate-400 transition-transform duration-300 ${showFormat ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showFormat && (
              <div className="px-6 pb-6 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Your CSV file must include the following columns. Course-related columns are optional.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700">
                        <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-200 font-medium">Column</th>
                        <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-200 font-medium">Required</th>
                        <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-200 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {[
                        ['name', 'Yes', 'Student full name'],
                        ['email', 'Yes', 'Valid email address'],
                        ['collegeName', 'Yes', 'College or institution name'],
                        ['department', 'Yes', 'Department or stream'],
                        ['year', 'Yes', 'Academic year (e.g. 2, 3)'],
                        ['skills', 'Yes', 'Comma-separated general skills'],
                        ['offerSkills', 'Yes', 'Skills the student will teach'],
                        ['wantedSkills', 'Yes', 'Skills the student wants to learn'],
                        ['courseTitle', 'No', 'Title for the teaching course'],
                        ['courseDescription', 'No', 'Course description'],
                        ['courseCategory', 'No', 'Category (e.g. Technology)'],
                        ['courseLevel', 'No', 'Beginner / Intermediate / Advanced'],
                        ['courseDuration', 'No', 'Course duration'],
                        ['courseObjectives', 'No', 'Learning objectives'],
                        ['modules', 'No', 'Module titles separated by commas'],
                        ['notes', 'No', 'Course notes'],
                        ['resources', 'No', 'Learning resource links'],
                        ['videoLinks', 'No', 'Video URLs'],
                        ['referenceLinks', 'No', 'Reference material links'],
                        ['liveClassLinks', 'No', 'Live class meeting link'],
                        ['assignmentLinks', 'No', 'Assignment links'],
                        ['quizLinks', 'No', 'Quiz links'],
                      ].map(([col, req, desc]) => (
                        <tr key={col as string}>
                          <td className="px-4 py-2 font-mono text-xs text-slate-800 dark:text-slate-200">{col}</td>
                          <td className="px-4 py-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${req === 'Yes' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                              {req}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={downloadSample}
                  className="mt-4 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                >
                  ⬇ Download Sample CSV
                </button>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
            <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">⚠️ Important Notes</h3>
            <ul className="list-disc list-inside text-sm text-amber-800 dark:text-amber-300 space-y-1">
              <li>Imported skills/courses will be created with <strong>pending</strong> status.</li>
              <li>Admin verification is required before content becomes publicly visible.</li>
              <li>Duplicate emails are automatically skipped.</li>
              <li>Passwords are set to a secure default and should be changed on first login.</li>
              <li>Maximum file size is <strong>5MB</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminImport;

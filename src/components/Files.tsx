import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { fetchJSON } from '../api';

interface SharedFile {
  _id: string;
  skillId: string;
  uploadedBy: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

const Files: React.FC = () => {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [skillId, setSkillId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchJSON('/skills/mine')
      .then((skills: any[]) => {
        if (!mounted) return;
        if (skills.length > 0 && !skillId) {
          setSkillId(skills[0]._id);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!skillId) return;
    let mounted = true;
    setLoading(true);
    fetchJSON(`/skills/${skillId}/files`)
      .then((data: SharedFile[]) => {
        if (mounted) setFiles(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [skillId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !skillId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('skillId', skillId);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/skills/' + skillId + '/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFiles((prev) => [data, ...prev]);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('zip')) return '🗜️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
    return '📁';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Files 📁</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Shared course resources</p>
          </div>

          <form onSubmit={handleUpload} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
            <div className="flex items-center gap-4">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>

          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">No files shared yet.</div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getFileIcon(file.mimeType)}</span>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{file.fileName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {formatSize(file.fileSize)} • {new Date(file.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <a
                    href={file.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition-all"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Files;
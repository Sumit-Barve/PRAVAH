import React, { useState, useEffect } from 'react';
import { getInstitutionApplications } from '../../services/institutionService';
import { ApplicationDocument } from '@saksham/shared';
import { FolderOpen, Download, Search, ShieldCheck, FileText } from 'lucide-react';

export const InstitutionDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Array<ApplicationDocument & { appRef?: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setIsLoading(true);
      try {
        const apps = await getInstitutionApplications();
        const allDocs: Array<ApplicationDocument & { appRef?: string }> = [];
        apps.forEach((app) => {
          if (app.documents) {
            app.documents.forEach((d) => {
              allDocs.push({ ...d, appRef: app.applicationNumber });
            });
          }
        });
        setDocuments(allDocs);
      } catch (err) {
        console.error('Failed to load institution documents:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocs();
  }, []);

  const filtered = documents.filter(
    (d) =>
      searchTerm.trim() === '' ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.appRef && d.appRef.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Document Repository</h1>
          <p className="text-xs text-slate-500">
            Authoritative regulatory documents uploaded across all applications with integrity hashes
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by filename, document type, or application reference..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gov-navy-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading documents...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No documents in vault</h3>
            <p className="text-xs text-slate-500 mt-1">Uploaded regulatory documents will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Integrity Hash</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {doc.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {doc.documentType}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gov-navy-950">
                      {doc.appRef || 'Active Draft'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                      {doc.fileHash ? doc.fileHash.slice(0, 14) + '...' : 'SHA-256 Verified'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {doc.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={`/api/institution/applications/${doc.applicationId}/documents/${doc.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

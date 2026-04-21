import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { DealFile } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface FileUploaderProps {
  files: DealFile[];
  onFilesChange: (files: DealFile[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ files, onFilesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { team } = useAuth();

  const getLimits = () => {
    const tier = team?.tier || 'SOLOPRENEUR';
    if (tier === 'M_AND_A') return { maxFiles: 100, maxMb: 100 };
    if (tier === 'FAMILY_OFFICE') return { maxFiles: 50, maxMb: 50 };
    return { maxFiles: 20, maxMb: 50 };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const { maxFiles, maxMb } = getLimits();
      const maxBytes = maxMb * 1024 * 1024;
      
      if (files.length + e.target.files.length > maxFiles) {
        alert(`Your current tier limits you to ${maxFiles} files per deal. Please upgrade for more capacity.`);
        return;
      }

      const newFiles: DealFile[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        
        if (file.size > maxBytes) {
           alert(`File ${file.name} is too large. Your tier allows up to ${maxMb}MB per file.`);
           continue;
        }
        
        // Check for Excel files
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel')) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer);
                
                // Convert all sheets to CSV and concatenate
                let csvContent = '';
                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    const csv = XLSX.utils.sheet_to_csv(sheet);
                    if (csv.trim()) {
                        csvContent += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
                    }
                });

                // Encode CSV to Base64
                // We use btoa but need to handle unicode characters properly
                const base64 = btoa(unescape(encodeURIComponent(csvContent)));
                
                newFiles.push({
                    name: file.name + ' (Converted)',
                    mimeType: 'text/csv', // Treat as CSV for Gemini
                    data: base64
                });
            } catch (err) {
                console.error("Error parsing Excel file", err);
                alert(`Failed to parse Excel file: ${file.name}`);
            }
        } else {
            // Standard handling for Images/PDFs/Text/Audio/Video
            const base64 = await convertToBase64(file);
            // Remove data URL prefix (e.g. "data:image/png;base64,") for Gemini
            const data = base64.split(',')[1];
            
            let mimeType = file.type;
            if (!mimeType && file.name.toLowerCase().endsWith('.amr')) {
                mimeType = 'audio/amr';
            }
            
            newFiles.push({
                name: file.name,
                mimeType: mimeType || 'application/octet-stream',
                data: data
            });
        }
      }
      
      onFilesChange([...files, ...newFiles]);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    onFilesChange(updated);
  };

  const { maxFiles, maxMb } = getLimits();

  return (
    <div className="mb-4">
      <div className="flex justify-between items-end mb-2">
        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">
          Deal Documents (CIM, P&L, Images, Excel)
        </label>
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
          {files.length} / {maxFiles} Files (Max {maxMb}MB/file)
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-2 mb-2">
        {files.map((file, idx) => (
          <div key={idx} className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded p-2 text-sm">
            <span className="truncate text-slate-300 max-w-[80%] flex items-center">
              <svg className="w-4 h-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {file.downloadUrl ? (
                <a href={file.downloadUrl} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 hover:underline">
                  {file.name}
                </a>
              ) : (
                file.name
              )}
            </span>
            <button 
              onClick={() => removeFile(idx)}
              className="text-slate-500 hover:text-red-400"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button 
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-900 hover:border-amber-400/50 text-slate-400 hover:text-amber-400 transition-all rounded-md py-4 flex flex-col items-center justify-center text-xs uppercase font-bold tracking-widest"
      >
        <svg className="w-6 h-6 mb-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload Documents
      </button>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        multiple 
        accept="image/*,audio/*,video/*,.amr,application/pdf,text/plain,text/csv,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx,.xls"
      />
    </div>
  );
};

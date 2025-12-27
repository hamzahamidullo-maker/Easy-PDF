
import React, { useState, useCallback, useRef } from 'react';
import { 
  FileUp, 
  FileText, 
  Trash2, 
  Download, 
  Settings, 
  FileCheck, 
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  X
} from 'lucide-react';
import { FileItem, ConversionOptions } from './types';
import { convertToPdf } from './services/pdfConverter';

export default function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({
    fileName: 'easy_pdf_document',
    pageSize: 'a4',
    orientation: 'p',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileItem[] = Array.from(selectedFiles).map((file) => {
      const isImage = file.type.startsWith('image/');
      const isText = file.type === 'text/plain';
      
      let type: FileItem['type'] = 'document';
      if (isImage) type = 'image';
      else if (isText) type = 'text';

      // Limit 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} is too large (max 10MB).`);
      }

      return {
        id: Math.random().toString(36).substring(7),
        file,
        type,
        status: 'pending',
        progress: 0,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined
      };
    });

    setFiles((prev) => [...prev, ...newFiles.filter(f => f.file.size <= 10 * 1024 * 1024)]);
    setConvertedBlob(null);
    setError(null);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const item = prev.find(f => f.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(f => f.id !== id);
    });
    setConvertedBlob(null);
  };

  const startConversion = async () => {
    if (files.length === 0) return;
    setIsConverting(true);
    setError(null);
    setConversionProgress(0);

    try {
      const pdfBlob = await convertToPdf(files, options, (progress) => {
        setConversionProgress(progress);
      });
      setConvertedBlob(pdfBlob);
    } catch (err) {
      setError("Failed to convert files. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const downloadPdf = () => {
    if (!convertedBlob) return;
    const url = URL.createObjectURL(convertedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${options.fileName || 'converted'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelection(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 py-6 px-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
              <FileCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">Easy PDF</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Instant Converter</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Private</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Fast</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-500" /> Free</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Convert anything to <span className="text-indigo-600">PDF</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Securely merge images and documents into a single, professional PDF file directly in your browser. No upload to servers needed.
          </p>
        </div>

        {/* Upload Area */}
        <div 
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={`
            relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300
            ${files.length > 0 ? 'border-slate-200 bg-white shadow-sm' : 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            multiple 
            accept="image/*,.txt"
            onChange={(e) => handleFileSelection(e.target.files)}
          />
          
          {files.length === 0 ? (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <FileUp size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Drag and drop files here</h3>
              <p className="text-slate-500 mb-8">Supports JPG, PNG, and Text files (Max 10MB each)</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Choose Files
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {files.map((fileItem) => (
                  <div 
                    key={fileItem.id} 
                    className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl group hover:border-indigo-200 transition-colors"
                  >
                    <div className="w-14 h-14 bg-white rounded-lg border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-400">
                      {fileItem.type === 'image' && fileItem.previewUrl ? (
                        <img src={fileItem.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={24} />
                      )}
                    </div>
                    <div className="flex-grow text-left overflow-hidden">
                      <p className="font-semibold text-slate-800 truncate text-sm">{fileItem.file.name}</p>
                      <p className="text-xs text-slate-500">{(fileItem.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button 
                      onClick={() => removeFile(fileItem.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 text-slate-500 font-medium p-4 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
                >
                  <FileUp size={18} />
                  Add More
                </button>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-700">Filename:</label>
                    <input 
                      type="text" 
                      value={options.fileName}
                      onChange={(e) => setOptions(prev => ({ ...prev, fileName: e.target.value }))}
                      className="bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none w-48"
                      placeholder="Enter filename"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-700">Size:</label>
                    <select 
                      value={options.pageSize}
                      onChange={(e) => setOptions(prev => ({ ...prev, pageSize: e.target.value as any }))}
                      className="bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="a4">A4</option>
                      <option value="letter">Letter</option>
                    </select>
                  </div>
                </div>

                {!convertedBlob ? (
                  <button 
                    disabled={isConverting}
                    onClick={startConversion}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Converting ({conversionProgress}%)
                      </>
                    ) : (
                      <>
                        <Settings size={20} />
                        Convert to PDF
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={downloadPdf}
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 animate-bounce transition-all active:scale-95"
                  >
                    <Download size={20} />
                    Download PDF
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={24} />
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Images to PDF</h4>
            <p className="text-sm text-slate-500 leading-relaxed">Combine multiple photos (JPG, PNG) into a single optimized document.</p>
          </div>
          <div className="text-center p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={24} />
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Text Documents</h4>
            <p className="text-sm text-slate-500 leading-relaxed">Convert plain text files into professional formatted PDF pages effortlessly.</p>
          </div>
          <div className="text-center p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings size={24} />
            </div>
            <h4 className="font-bold text-slate-800 mb-2">Browser Based</h4>
            <p className="text-sm text-slate-500 leading-relaxed">Fast and private. Your files never leave your computer for maximum security.</p>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-12 px-4 text-center border-t border-slate-200 bg-white">
        <p className="text-slate-400 text-sm font-medium">Built with precision for better document management. No registration required.</p>
        <div className="mt-4 flex justify-center gap-6 text-slate-400">
          <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Help</a>
        </div>
      </footer>
    </div>
  );
}

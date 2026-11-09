import React, { useState, useRef, ChangeEvent } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Sparkles, Download, CheckCircle2 } from 'lucide-react';
import { parseSpreadsheetFile } from '../utils/excelParser';
import { SAMPLE_APPLICANTS_DATA, downloadSampleSpreadsheet } from '../utils/sampleDataGenerator';
import { ApplicantRecord, ParseResult } from '../types/dashboard';

interface FileUploadZoneProps {
  onDataLoaded: (applicants: ApplicantRecord[], fileName: string, parseResult: ParseResult) => void;
  lang: 'ar' | 'en';
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onDataLoaded, lang }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAr = lang === 'ar';

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setError(isAr ? 'نوع الملف غير مدعوم. يرجى اختيار ملف إكسل (.xlsx, .xls) أو ملف CSV.' : 'Unsupported file type. Please upload .xlsx, .xls, or .csv.');
      setLoading(false);
      return;
    }

    try {
      const result = await parseSpreadsheetFile(file);
      if (!result.success) {
        setError(result.error || (isAr ? 'تعذر قراءة بيانات الجدول.' : 'Failed to parse spreadsheet data.'));
      } else {
        onDataLoaded(result.applicants, result.fileName, result);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadDemo = () => {
    const demoResult: ParseResult = {
      success: true,
      applicants: SAMPLE_APPLICANTS_DATA,
      fileName: 'OC_Media_SAMPLE_TEST_DATA.xlsx [بيانات تجريبية]',
      rowCount: SAMPLE_APPLICANTS_DATA.length,
      columnsDetected: ['Submission ID', 'Full Name', 'Phone Number', 'Academic Year', 'Media Skills', 'Equipment', 'Portfolio URL', 'Status'],
      warnings: ['يتم عرض بيانات تجريبية افتراضية للمعاينة فقط.']
    };
    onDataLoaded(SAMPLE_APPLICANTS_DATA, demoResult.fileName, demoResult);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Upload Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-brand-cyan bg-brand-blue/15 scale-[1.01]'
            : 'border-slate-700 bg-brand-dark hover:border-slate-500 hover:bg-brand-navy/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFileChange}
          className="hidden"
          disabled={loading}
        />

        <div className="w-16 h-16 rounded-2xl bg-brand-navy border border-slate-700 flex items-center justify-center mx-auto mb-4 text-brand-cyan shadow-sm">
          {loading ? (
            <div className="w-8 h-8 border-3 border-brand-cyan border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileSpreadsheet className="w-8 h-8" />
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-1.5">
          {isAr ? 'ارفع ملف إكسل أو CSV لتحليله' : 'Upload Excel or CSV file to analyze'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-4">
          {isAr
            ? 'قم بتنزيل شيت المتقدمين من Google Sheets بصيغة XLSX أو CSV وارفعه هنا لمعالجة وتحليل البيانات محلياً داخل المتصفح.'
            : 'Download the recruitment spreadsheet from Google Sheets as XLSX or CSV and drop it here for instant local browser-side analytics.'}
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blueHover text-white text-xs font-bold transition shadow-sm">
          <Upload className="w-4 h-4" />
          <span>{isAr ? 'اختر ملف من جهازك' : 'Browse file from device'}</span>
        </div>

        <div className="text-[11px] text-slate-500 mt-4 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isAr ? 'خصوصية تامة: تتم المعالجة بالكامل داخل جهازك دون إرسال البيانات لأي خوادم خارجية' : 'Strict privacy: Processing happens 100% locally in your browser memory'}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block mb-0.5">{isAr ? 'خطأ في معالجة الملف:' : 'Error processing file:'}</span>
            {error}
          </div>
        </div>
      )}

      {/* Quick Demo & Template Actions */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
        <button
          type="button"
          onClick={handleLoadDemo}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 border border-brand-cyan/30 text-brand-cyan font-bold transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAr ? 'معاينة لوحة التحكم ببيانات تجريبية (Demo)' : 'Preview with Fictional Test Dataset (Demo)'}</span>
        </button>

        <button
          type="button"
          onClick={downloadSampleSpreadsheet}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-navy/60 hover:bg-brand-navy border border-slate-700 text-slate-300 transition flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>{isAr ? 'تحميل نموذج Excel تجريبي' : 'Download Sample Excel Template'}</span>
        </button>
      </div>
    </div>
  );
};


import { 
  Video, 
  Camera, 
  Film, 
  Palette, 
  Sparkles, 
  Share2, 
  PenTool, 
  FileText, 
  Sliders, 
  Volume2, 
  Layout, 
  PlusCircle,
  Smartphone,
  Mic,
  Sun,
  Laptop,
  Tablet,
  Headphones,
  CheckCircle2
} from 'lucide-react';
import React from 'react';

export interface OptionItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon?: React.ElementType;
}

export const ACADEMIC_YEARS: { id: 'First' | 'Second' | 'Third' | 'Fourth'; labelAr: string; labelEn: string }[] = [
  { id: 'First', labelAr: 'الفرقة الأولى', labelEn: '1st Year' },
  { id: 'Second', labelAr: 'الفرقة الثانية', labelEn: '2nd Year' },
  { id: 'Third', labelAr: 'الفرقة الثالثة', labelEn: '3rd Year' },
  { id: 'Fourth', labelAr: 'الفرقة الرابعة', labelEn: '4th Year' },
];

export const MEDIA_SKILLS: OptionItem[] = [
  { id: 'Video Editing', labelAr: 'مونتاج الفيديو', labelEn: 'Video Editing', icon: Video },
  { id: 'Photography', labelAr: 'تصوير فوتوغرافي', labelEn: 'Photography', icon: Camera },
  { id: 'Videography', labelAr: 'تصوير فيديو وإخراج', labelEn: 'Videography', icon: Film },
  { id: 'Graphic Design', labelAr: 'تصميم جرافيك', labelEn: 'Graphic Design', icon: Palette },
  { id: 'Motion Graphics', labelAr: 'موشن جرافيكس', labelEn: 'Motion Graphics', icon: Sparkles },
  { id: 'Social Media Management', labelAr: 'إدارة سوشيال ميديا', labelEn: 'Social Media', icon: Share2 },
  { id: 'Content Creation', labelAr: 'صناعة محتوى وإعداد', labelEn: 'Content Creation', icon: PenTool },
  { id: 'Copywriting', labelAr: 'كتابة محتوى وسكريبت', labelEn: 'Copywriting', icon: FileText },
  { id: 'Color Grading', labelAr: 'تصحيح وتلوين فيديو', labelEn: 'Color Grading', icon: Sliders },
  { id: 'Sound Design', labelAr: 'هندسة وتصميم صوت', labelEn: 'Sound Design', icon: Volume2 },
  { id: 'UI/UX Design', labelAr: 'تصميم واجهات UI/UX', labelEn: 'UI/UX Design', icon: Layout },
  { id: 'Other', labelAr: 'مهارة أخرى...', labelEn: 'Other', icon: PlusCircle },
];

export const EQUIPMENT_OPTIONS: OptionItem[] = [
  { id: 'DSLR / Mirrorless Camera', labelAr: 'كاميرا احترافية DSLR / Mirrorless', labelEn: 'Camera', icon: Camera },
  { id: 'Mobile Camera', labelAr: 'كاميرا هاتف بجودة عالية', labelEn: 'Phone Camera', icon: Smartphone },
  { id: 'Tripod', labelAr: 'حامل كاميرا / ترايبود', labelEn: 'Tripod', icon: CheckCircle2 },
  { id: 'Gimbal', labelAr: 'مانع اهتزاز (جيمبل)', labelEn: 'Gimbal', icon: Sparkles },
  { id: 'Microphone', labelAr: 'ميكروفون تسجيل صوتي', labelEn: 'Microphone', icon: Mic },
  { id: 'Ring Light', labelAr: 'رينج لايت', labelEn: 'Ring Light', icon: Sun },
  { id: 'Softbox / Studio Lighting', labelAr: 'إضاءة سوفت بوكس / استوديو', labelEn: 'Studio Lights', icon: Sun },
  { id: 'Laptop / PC', labelAr: 'كمبيوتر / لابتوب للمونتاج', labelEn: 'PC / Laptop', icon: Laptop },
  { id: 'Drawing Tablet', labelAr: 'تابلت رسم ديجيتال', labelEn: 'Drawing Tablet', icon: Tablet },
  { id: 'Headphones', labelAr: 'سماعات احترافية للمونتاج', labelEn: 'Headphones', icon: Headphones },
  { id: 'Other', labelAr: 'معدات أخرى...', labelEn: 'Other', icon: PlusCircle },
];

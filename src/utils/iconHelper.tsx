import React from 'react';
import {
  BookOpen,
  Cpu,
  Atom,
  Calculator,
  Globe,
  Landmark,
  Palette,
  Sparkles,
  FileText,
  Video,
  Presentation,
  Code,
  Image,
  Folder,
  Layers,
  GraduationCap,
  Bookmark,
  Share2,
  HelpCircle
} from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name?.toLowerCase()) {
    case 'cpu':
    case 'computer':
      return <Cpu className={className} />;
    case 'atom':
    case 'science':
      return <Atom className={className} />;
    case 'calculator':
    case 'math':
      return <Calculator className={className} />;
    case 'bookopen':
    case 'book':
    case 'thai':
      return <BookOpen className={className} />;
    case 'globe':
    case 'foreign_lang':
    case 'language':
      return <Globe className={className} />;
    case 'landmark':
    case 'social':
      return <Landmark className={className} />;
    case 'palette':
    case 'arts':
    case 'art':
      return <Palette className={className} />;
    case 'sparkles':
    case 'general':
      return <Sparkles className={className} />;
    case 'filetext':
    case 'pdf':
      return <FileText className={className} />;
    case 'video':
      return <Video className={className} />;
    case 'presentation':
    case 'slide':
      return <Presentation className={className} />;
    case 'code':
      return <Code className={className} />;
    case 'image':
      return <Image className={className} />;
    case 'graduationcap':
      return <GraduationCap className={className} />;
    case 'bookmark':
      return <Bookmark className={className} />;
    case 'share':
      return <Share2 className={className} />;
    case 'layers':
      return <Layers className={className} />;
    default:
      return <Folder className={className} />;
  }
};

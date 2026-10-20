import React, { useState } from 'react';
import { Megaphone, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const AnnouncementBanner: React.FC = () => {
  const { settings } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  if (!settings.announcementActive || !settings.announcement || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 text-white text-xs sm:text-sm py-2 px-4 shadow-xs relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="shrink-0 bg-white/20 p-1 rounded-md">
            <Megaphone className="w-3.5 h-3.5" />
          </span>
          <span className="font-semibold text-sky-200 shrink-0">ประกาศ:</span>
          <span className="truncate">{settings.announcement}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 hover:bg-white/10 rounded-md transition-colors"
          title="ปิดประกาศ"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

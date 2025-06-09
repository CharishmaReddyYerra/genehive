import React from 'react';
import { Clock, Users, AlertCircle, CheckCircle, X } from 'lucide-react';
import { SessionRecoveryInfo } from '../utils/autoSave';

interface SessionRecoveryDialogProps {
  isOpen: boolean;
  recoveryInfo: SessionRecoveryInfo;
  onRecover: () => void;
  onDismiss: () => void;
  darkMode?: boolean;
}

const SessionRecoveryDialog: React.FC<SessionRecoveryDialogProps> = ({
  isOpen,
  recoveryInfo,
  onRecover,
  onDismiss,
  darkMode = false
}) => {
  if (!isOpen || !recoveryInfo.hasRecoverableData) {
    return null;
  }

  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'Unknown time';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Dialog */}
        <div className={`max-w-md w-full rounded-lg shadow-xl border ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className={`p-6 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                recoveryInfo.isRecent 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-orange-100 text-orange-600'
              }`}>
                {recoveryInfo.isRecent ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Resume Previous Session?
                </h3>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  We found auto-saved family data
                </p>
              </div>
              <button
                onClick={onDismiss}
                className={`p-1 rounded-lg hover:bg-opacity-20 transition-colors ${
                  darkMode 
                    ? 'hover:bg-white text-gray-400 hover:text-gray-300' 
                    : 'hover:bg-gray-500 text-gray-500 hover:text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Recovery Info */}
              <div className={`p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <Clock className={`w-5 h-5 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <div>
                    <p className={`font-medium ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Last saved: {formatTimeAgo(recoveryInfo.lastSaveTime)}
                    </p>
                    {recoveryInfo.lastSaveTime && (
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {recoveryInfo.lastSaveTime.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className={`w-5 h-5 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <p className={`${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {recoveryInfo.memberCount} family member{recoveryInfo.memberCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Status Message */}
              <div className={`p-3 rounded-lg ${
                recoveryInfo.isRecent
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-orange-50 border border-orange-200 text-orange-800'
              }`}>
                <p className="text-sm">
                  {recoveryInfo.isRecent ? (
                    <>✓ This data appears to be recent and safe to recover.</>
                  ) : (
                    <>⚠️ This data is older than usual. Please verify it's what you expect.</>
                  )}
                </p>
              </div>

              {/* Warning */}
              <div className={`p-3 rounded-lg border ${
                darkMode 
                  ? 'bg-yellow-900 border-yellow-700 text-yellow-200' 
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
                <p className="text-sm">
                  <strong>Note:</strong> Recovering this session will replace any current family data. 
                  Make sure to export your current work if needed.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={`p-6 border-t flex gap-3 ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={onRecover}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                recoveryInfo.isRecent
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              Recover Session
            </button>
            
            <button
              onClick={onDismiss}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionRecoveryDialog;
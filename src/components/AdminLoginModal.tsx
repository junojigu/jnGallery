import React, { useState } from 'react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  adminPassword?: string;
  ownerEmail?: string;
  message?: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  adminPassword = 'admin',
  ownerEmail = 'junojigu@gmail.com',
  message,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const ownerUsername = ownerEmail.split('@')[0].toLowerCase();
  const trimmedLowerInput = password.trim().toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid =
      password === adminPassword ||
      trimmedLowerInput === 'admin' ||
      trimmedLowerInput === ownerEmail.toLowerCase() ||
      trimmedLowerInput === ownerUsername;

    if (isValid) {
      setError('');
      setPassword('');
      onLoginSuccess();
      onClose();
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-xl p-6 md:p-8 max-w-md w-full ambient-shadow border border-[#c4c7c7]/30">
        <div className="flex justify-between items-center mb-6 border-b border-[#e2e2e2] pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000000] text-2xl">admin_panel_settings</span>
            <h2 className="font-serif text-xl font-semibold text-[#000000]">관리자 로그인 (Admin Login)</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#747878] hover:text-[#000000] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-[#f3f3f4] border-l-4 border-[#000000] text-xs text-[#1a1c1c] rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1.5">
              관리자 비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="비밀번호 입력"
                required
                autoFocus
                className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000] focus:border-[#000000] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#747878] hover:text-[#000000] cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {error && (
              <p className="text-xs text-[#ba1a1a] mt-1.5 font-medium">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e2e2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#747878] text-[#000000] rounded-lg text-xs font-medium hover:bg-[#e2e2e2] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#000000] text-white rounded-lg text-xs font-medium hover:bg-opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

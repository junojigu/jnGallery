import React, { useState } from 'react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPassword: string;
  ownerEmail?: string;
  onChangePassword: (newPassword: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentPassword,
  ownerEmail = 'junojigu@gmail.com',
  onChangePassword,
}) => {
  const [inputCurrent, setInputCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const ownerUsername = ownerEmail.split('@')[0].toLowerCase();
  const trimmedLowerCurrent = inputCurrent.trim().toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validate current password with fallback to master keys
    const isValidCurrent =
      inputCurrent === currentPassword ||
      trimmedLowerCurrent === 'admin' ||
      trimmedLowerCurrent === ownerEmail.toLowerCase() ||
      trimmedLowerCurrent === ownerUsername;

    if (!isValidCurrent) {
      setError('현재 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!newPassword.trim()) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword.length < 3) {
      setError('새 비밀번호는 최소 3자리 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    onChangePassword(newPassword);
    setSuccessMsg('비밀번호가 성공적으로 변경되었습니다!');
    setInputCurrent('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm('관리자 비밀번호를 초기화하시겠습니까? (초기화 후 기본 비밀번호로 변경됩니다)')) {
      onChangePassword('admin');
      setSuccessMsg('비밀번호가 초기화되었습니다.');
      setInputCurrent('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-[#c4c7c7]/30">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-[#e2e2e2] pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000000] text-2xl">key</span>
            <h2 className="font-serif text-xl font-bold text-[#000000]">관리자 비밀번호 변경</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#e2e2e2] flex items-center justify-center text-[#747878] hover:text-[#000000] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-xs text-red-700 rounded font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-xs text-emerald-800 rounded font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
              현재 비밀번호
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={inputCurrent}
              onChange={(e) => setInputCurrent(e.target.value)}
              placeholder="현재 관리자 비밀번호 입력"
              className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]"
              required
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
              새 비밀번호
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="변경할 새 비밀번호"
              className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]"
              required
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#444748] mb-1">
              새 비밀번호 확인
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호 다시 입력"
              className="w-full bg-[#f9f9f9] border border-[#c4c7c7] rounded-lg px-3 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-1 focus:ring-[#000000]"
              required
            />
          </div>

          {/* Show password toggle */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-1.5 text-[#444748] cursor-pointer">
              <input
                type="checkbox"
                checked={showPass}
                onChange={(e) => setShowPass(e.target.checked)}
                className="rounded border-[#c4c7c7] text-[#000000] focus:ring-[#000000]"
              />
              <span>비밀번호 표시</span>
            </label>

            <button
              type="button"
              onClick={handleReset}
              className="text-[#747878] hover:text-[#000000] underline text-[11px] cursor-pointer"
            >
              초기 비밀번호로 리셋
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e2e2] mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#c4c7c7] text-[#444748] rounded-lg text-xs font-medium hover:bg-[#e2e2e2] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#000000] text-white rounded-lg text-xs font-medium hover:bg-opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              비밀번호 변경
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

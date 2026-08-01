import React from 'react';

interface DeleteModalProps {
  isOpen: boolean;
  itemType: string;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  itemType,
  itemName,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-xl p-8 max-w-sm w-full ambient-shadow border border-[#c4c7c7]/30 transform scale-100 transition-all">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#ffdad6] text-[#93000a] mb-4 mx-auto">
          <span className="material-symbols-outlined text-2xl">delete_forever</span>
        </div>
        
        <h3 className="font-sans text-lg font-semibold text-center text-[#000000] mb-2">
          Delete {itemType}?
        </h3>
        
        <p className="font-sans text-sm text-center text-[#444748] mb-6 leading-relaxed">
          Are you sure you want to delete &ldquo;
          <span className="font-semibold text-[#000000]">{itemName}</span>
          &rdquo;? This action cannot be undone and will remove it from all associated photos.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#747878] rounded-lg text-[#000000] text-xs font-medium hover:bg-[#e2e2e2] transition-colors flex-1 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-[#ba1a1a] text-white rounded-lg text-xs font-medium hover:bg-opacity-90 transition-opacity flex-1 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

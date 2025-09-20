import React from 'react';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: 'red' | 'blue' | 'green';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  confirmButtonColor = 'red',
  onConfirm,
  onCancel,
}) => {
  if (!visible) return null;

  const getConfirmButtonClass = () => {
    switch (confirmButtonColor) {
      case 'red':
        return 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600';
      case 'blue':
        return 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600';
      case 'green':
        return 'px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600';
      default:
        return 'px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600';
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={getConfirmButtonClass()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

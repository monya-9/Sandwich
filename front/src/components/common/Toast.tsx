import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export interface ToastProps {
  /** 토스트 메시지 */
  message: string;
  /** 토스트 타입 (색상 결정) */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** 토스트 크기 */
  size?: 'small' | 'medium' | 'large';
  /** 자동 닫힘 시간 (ms, 0이면 자동 닫힘 안함) */
  autoClose?: number;
  /** 수동으로 닫을 수 있는지 여부 */
  closable?: boolean;
  /** 토스트가 보여지는지 여부 */
  visible: boolean;
  /** 토스트 닫기 콜백 */
  onClose: () => void;
  /** 아이콘 (선택사항) */
  icon?: React.ReactNode;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  size = 'medium',
  autoClose = 3000,
  closable = true,
  visible,
  onClose,
  icon,
}) => {
  // onClose를 ref로 저장하여 의존성 문제 해결
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 자동 닫힘
  useEffect(() => {
    if (visible && autoClose > 0) {
      const timer = setTimeout(() => {
        onCloseRef.current();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [visible, autoClose]); // onClose 의존성 제거

  if (!visible) return null;

  // 타입별 스타일
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: '#10B981', // green-500
          iconBg: '#059669', // green-600
        };
      case 'error':
        return {
          background: '#EF4444', // red-500
          iconBg: '#DC2626', // red-600
        };
      case 'warning':
        return {
          background: '#F59E0B', // amber-500
          iconBg: '#D97706', // amber-600
        };
      case 'info':
      default:
        return {
          background: '#3B82F6', // blue-500
          iconBg: '#2563EB', // blue-600
        };
    }
  };

  // 크기별 스타일
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '8px 16px',
          fontSize: '14px',
          minWidth: '200px',
          minHeight: '32px',
          gap: '8px',
          iconSize: '18px',
        };
      case 'large':
        return {
          padding: '18px 38px',
          fontSize: '20px',
          minWidth: '340px',
          minHeight: '46px',
          gap: '24px',
          iconSize: '28px',
        };
      case 'medium':
      default:
        return {
          padding: '12px 20px',
          fontSize: '16px',
          minWidth: '280px',
          minHeight: '40px',
          gap: '12px',
          iconSize: '22px',
        };
    }
  };

  const typeStyles = getTypeStyles();
  const sizeStyles = getSizeStyles();

  // 타입별 기본 아이콘
  const getDefaultIcon = () => {
    if (icon) return icon; // 사용자가 직접 아이콘을 제공한 경우
    
    switch (type) {
      case 'success':
        return <CheckCircle2 size={parseInt(sizeStyles.iconSize)} />;
      case 'error':
        return <XCircle size={parseInt(sizeStyles.iconSize)} />;
      case 'warning':
        return <AlertTriangle size={parseInt(sizeStyles.iconSize)} />;
      case 'info':
      default:
        return <Info size={parseInt(sizeStyles.iconSize)} />;
    }
  };

  const toastElement = (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20000,
        background: typeStyles.background,
        color: '#fff',
        fontFamily: "'Gmarket Sans', sans-serif",
        fontWeight: 600,
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        padding: sizeStyles.padding,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sizeStyles.gap,
        fontSize: sizeStyles.fontSize,
        letterSpacing: '0.02em',
        minWidth: sizeStyles.minWidth,
        minHeight: sizeStyles.minHeight,
        cursor: closable ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
      }}
      onClick={closable ? onClose : undefined}
    >
      <div
        style={{
          width: sizeStyles.iconSize,
          height: sizeStyles.iconSize,
          borderRadius: '50%',
          background: typeStyles.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${parseInt(sizeStyles.iconSize) * 0.6}px`,
          fontWeight: 'bold',
          flexShrink: 0,
        }}
      >
        {getDefaultIcon()}
      </div>
      <span>{message}</span>
    </div>
  );

  return ReactDOM.createPortal(toastElement, document.body);
};

export default Toast;

import React from "react";

interface EnvVar {
  key: string;
  value: string;
  status?: 'OK' | 'FAILED';
  message?: string;
}

interface EnvVarsInputProps {
  envVars: EnvVar[];
  onEnvVarsChange: (envVars: EnvVar[]) => void;
  submitted?: boolean;
}

const EnvVarsInput: React.FC<EnvVarsInputProps> = ({
  envVars,
  onEnvVarsChange,
  submitted = false
}) => {
  const addEnvVar = () => {
    onEnvVarsChange([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    onEnvVarsChange(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    onEnvVarsChange(envVars.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div>
      <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">환경 변수 (env)</div>

      <div className="space-y-3">
        {envVars.map((envVar, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="변수명"
                value={envVar.key}
                onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                className="border border-[#ADADAD] dark:border-[var(--border-color)] rounded px-3 py-2 w-full text-[14px] placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white dark:bg-[var(--surface)] dark:text-white"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="값"
                value={envVar.value}
                onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                className="border border-[#ADADAD] dark:border-[var(--border-color)] rounded px-3 py-2 w-full text-[14px] placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white dark:bg-[var(--surface)] dark:text-white"
              />
            </div>
            <div className="flex items-center gap-1">
              {/* 상태 표시 */}
              {submitted && envVar.status && (
                <div className="flex items-center gap-1">
                  {envVar.status === 'OK' ? (
                    <span className="text-green-600 text-sm">✓</span>
                  ) : (
                    <span className="text-red-600 text-sm">✗</span>
                  )}
                  {envVar.status === 'FAILED' && envVar.message && (
                    <span className="text-red-600 text-xs max-w-32 truncate" title={envVar.message}>
                      {envVar.message}
                    </span>
                  )}
                </div>
              )}
              
              {envVars.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEnvVar(index)}
                  className="w-8 h-8 flex items-center justify-center rounded border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  -
                </button>
              )}
              {index === envVars.length - 1 && (
                <button
                  type="button"
                  onClick={addEnvVar}
                  className="w-8 h-8 flex items-center justify-center rounded border border-green-300 bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                >
                  +
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[12px] text-gray-500 dark:text-white/60 mt-2">
        환경 변수를 변수명과 값으로 나누어 입력하세요. Key name은 알파벳/숫자/_/-만 허용됩니다.
        {submitted && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300">
            <strong>보안 안내:</strong> 기존 환경변수 값은 보안상 표시되지 않습니다. 새로운 값을 입력해주세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvVarsInput;
export type { EnvVar };

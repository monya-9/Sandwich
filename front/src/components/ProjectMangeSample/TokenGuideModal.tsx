import React from "react";

interface TokenGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const TokenGuideModal: React.FC<TokenGuideModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-[var(--surface)] w-[800px] max-w-[95%] rounded-xl shadow-xl max-h-[90vh] overflow-hidden border border-black/10 dark:border-[var(--border-color)]">
        <div className="px-6 py-4 border-b border-black/10 dark:border-[var(--border-color)] flex items-center justify-between">
          <div className="text-[20px] font-semibold text-black dark:text-white">GitHub 토큰 발급 가이드</div>
          <button type="button" className="w-10 h-10 text-[28px] leading-none text-black dark:text-white" onClick={onClose}>×</button>
        </div>
        <div className="p-6 overflow-auto" style={{maxHeight: '75vh'}}>
          <div className="prose prose-sm max-w-none text-gray-800 dark:text-white">
            <p className="text-[16px] leading-relaxed mb-4">
              샌드위치 서비스에서 GitHub 저장소 자동 배포 및 PR 기능을 사용하려면, 사용자 본인의 GitHub Personal Access Token(PAT)을 등록해야 합니다.
            </p>
            <p className="text-[16px] leading-relaxed mb-6">
              아래 안내에 따라 토큰을 발급받아 주세요.
            </p>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-6"></div>
            
            <h3 className="text-[18px] font-semibold text-black dark:text-white mb-3">1. GitHub 접속 및 토큰 발급 페이지 이동</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li className="text-[15px]">웹 브라우저에서 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">GitHub 토큰 생성 페이지</a>로 이동합니다.</li>
              <li className="text-[15px]">GitHub에 로그인되어 있지 않다면 로그인합니다.</li>
            </ul>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-6"></div>
            
            <h3 className="text-[18px] font-semibold text-black dark:text-white mb-3">2. 새 토큰 생성</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li className="text-[15px]">상단의 <strong>Generate new token</strong> 버튼을 클릭합니다.</li>
            </ul>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-6"></div>
            
            <h3 className="text-[18px] font-semibold text-black dark:text-white mb-3">3. 토큰 세부 설정</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-[15px]"><strong>Note</strong> (토큰 이름): <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">Sandwich App Token</code> 등 알아보기 쉬운 이름을 입력하세요.</li>
              <li className="text-[15px]"><strong>Expiration</strong> (만료 기간): 원하는 기간을 선택합니다. (예: 30일, 90일, 없음)</li>
              <li className="text-[15px]"><strong>Select scopes</strong> (권한 범위): 아래 권한은 반드시 선택해 주세요.</li>
            </ul>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <ul className="list-disc pl-6 space-y-1">
                <li className="text-[15px]"><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">repo</code> : 저장소 읽기/쓰기 권한 (PR 생성, 코드 읽기/쓰기 등)</li>
                <li className="text-[15px]"><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">workflow</code> : GitHub Actions 워크플로우 관련 권한 (필요시 선택)</li>
              </ul>
              <p className="text-[14px] text-gray-600 dark:text-gray-300 mt-2">
                필요한 권한만 최소한으로 선택하는 것을 권장합니다.
              </p>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-6"></div>
            
            <h3 className="text-[18px] font-semibold text-black dark:text-white mb-3">4. 토큰 생성 및 복사</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-[15px]">설정을 완료한 뒤 <strong>Generate token</strong> 버튼을 클릭합니다.</li>
              <li className="text-[15px]">생성된 토큰 문자열을 반드시 복사해 안전한 곳에 저장하세요.</li>
            </ul>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-[15px] font-semibold text-yellow-800 dark:text-yellow-200">
                ⚠️ 생성 후에는 다시 확인할 수 없습니다.
              </p>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-6"></div>
            
            <h3 className="text-[18px] font-semibold text-black dark:text-white mb-3">5. 토큰 등록</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li className="text-[15px]">샌드위치 서비스 내 'GitHub 토큰 등록' 화면에서 복사한 토큰을 입력하고 저장하세요.</li>
            </ul>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-6"></div>
            
            <h3 className="text-[18px] font-semibold text-black dark:text-white mb-3">주의 사항</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-[15px]">토큰은 개인의 GitHub 계정 권한을 갖고 있으므로 외부에 유출되지 않도록 주의해 주세요.</li>
              <li className="text-[15px]">토큰 만료 또는 권한 변경 시 서비스가 정상 동작하지 않을 수 있으니 필요 시 재등록 바랍니다.</li>
            </ul>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-6"></div>
            
            <p className="text-[15px] text-gray-600 dark:text-gray-300 mb-4">
              필요한 경우 언제든 다시 이 안내를 참고해 토큰을 재발급하거나 권한을 확인해 주세요.
            </p>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-4"></div>
            
            <p className="text-[15px] text-gray-600 dark:text-gray-300">
              궁금한 점이 있으면 지원팀에 문의 바랍니다.
            </p>
          </div>
        </div>
        <div className="px-6 py-3 border-t border-black/10 dark:border-[var(--border-color)] flex justify-end gap-2">
          <button type="button" className="h-9 px-4 border border-[#E5E7EB] dark:border-[var(--border-color)] rounded bg-white dark:bg-[var(--surface)] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/5" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default TokenGuideModal;

import React from 'react';
import { AccountSearchResult, highlightSearchTerm } from '../../api/accounts';

interface AccountCardProps {
  account: AccountSearchResult;
  searchTerm: string;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, searchTerm }) => {
  const { id, nickname, avatarUrl, isVerified, email, position, projects } = account;

  // 이메일에서 첫 글자 추출 (이메일이 있으면 이메일, 없으면 닉네임)
  const getInitial = () => {
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return nickname.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* 프로필 헤더 - 스크린샷처럼 좌측 정렬 */}
      <div className="flex items-start space-x-3 mb-3">
        {/* 프로필 이미지 */}
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={nickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg">
              {getInitial()}
            </div>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            <span 
              dangerouslySetInnerHTML={{ 
                __html: highlightSearchTerm(nickname, searchTerm) 
              }}
            />
          </h3>
          <p className="text-sm text-gray-600">
            {position || (isVerified ? '인증된 사용자' : '일반 사용자')}
          </p>
        </div>
      </div>

      {/* 프로젝트 영역 - 스크린샷처럼 가로로 3개씩 */}
      <div className="grid grid-cols-3 gap-2">
        {projects && projects.length > 0 ? (
          <>
            {projects.slice(0, 3).map((project, index) => (
              <div key={project.id || index} className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                {project.thumbnailUrl ? (
                  <img 
                    src={project.thumbnailUrl} 
                    alt={project.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <span className="text-xs text-gray-500 text-center px-1">
                    {project.title}
                  </span>
                )}
              </div>
            ))}
            {/* 빈 프로젝트 슬롯 채우기 */}
            {Array.from({ length: Math.max(0, 3 - projects.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square bg-gray-100 rounded"></div>
            ))}
          </>
        ) : (
          <>
            <div className="aspect-square bg-gray-100 rounded"></div>
            <div className="aspect-square bg-gray-100 rounded"></div>
            <div className="aspect-square bg-gray-100 rounded"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountCard;

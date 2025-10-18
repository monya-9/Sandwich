import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountSearchResult, highlightSearchTerm } from '../../api/accounts';
import { coverById } from '../../utils/getProjectCover';

interface AccountCardProps {
  account: AccountSearchResult;
  searchTerm: string;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, searchTerm }) => {
  const { id, nickname, avatarUrl, isVerified, email, position, projects } = account;
  const navigate = useNavigate();

  // 이메일에서 첫 글자 추출 (이메일이 있으면 이메일, 없으면 닉네임)
  const getInitial = () => {
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return nickname.charAt(0).toUpperCase();
  };

  // 프로필 클릭 시 해당 사용자 프로필로 이동
  const handleProfileClick = () => {
    navigate(`/users/${id}`);
  };

  // 프로젝트 클릭 시 해당 프로젝트 페이지로 이동
  const handleProjectClick = (projectId: number) => {
    navigate(`/other-project/${id}/${projectId}`);
  };

  return (
    <div className="bg-white dark:bg-[var(--surface)] rounded-lg border border-gray-200 dark:border-[var(--border-color)] p-4 hover:shadow-md transition-shadow">
      {/* 프로필 헤더 - 스크린샷처럼 좌측 정렬, 클릭 가능 */}
      <div className="flex items-start space-x-3 mb-3 cursor-pointer" onClick={handleProfileClick}>
        {/* 프로필 이미지 - 위 드롭다운과 동일한 스타일 */}
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-[var(--avatar-bg)] flex items-center justify-center overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={nickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-[var(--avatar-bg)] flex items-center justify-center text-gray-700 dark:text-white font-bold text-lg">
              {getInitial()}
            </div>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <span 
              dangerouslySetInnerHTML={{ 
                __html: highlightSearchTerm(nickname, searchTerm) 
              }}
            />
          </h3>
          <p className="text-sm text-gray-600 dark:text-white">
            {position || (isVerified ? '인증된 사용자' : '일반 사용자')}
          </p>
        </div>
      </div>

      {/* 프로젝트 영역 - 실제 프로젝트 이미지 표시 */}
      <div className="grid grid-cols-3 gap-2">
        {projects && projects.length > 0 ? (
          <>
            {projects.slice(0, 3).map((project, index) => (
              <div 
                key={project.id || index} 
                className="aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleProjectClick(project.id)}
              >
                <img 
                  src={project.coverUrl || coverById({ id: project.id })} 
                  alt={`Project ${project.id}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 이미지 로딩 실패 시 랜덤 이미지로 대체
                    const target = e.target as HTMLImageElement;
                    target.src = coverById({ id: project.id });
                  }}
                />
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

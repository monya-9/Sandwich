// src/components/challenge/RewardClaimModal.tsx
import React, { useState } from 'react';
import { X, Gift, CheckCircle, Clock } from 'lucide-react';
import { claimReward, type RewardItem } from '../../api/challenge_creditApi';

interface RewardClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeTitle: string;
  userReward: RewardItem | null;
  onRewardClaimed: () => void;
}

export default function RewardClaimModal({
  isOpen,
  onClose,
  challengeTitle,
  userReward,
  onRewardClaimed
}: RewardClaimModalProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const getRankIcon = (rank?: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🎖';
    }
  };

  const getRankText = (rank?: number) => {
    switch (rank) {
      case 1: return '1등';
      case 2: return '2등';
      case 3: return '3등';
      default: return '참가자';
    }
  };

  const handleClaimReward = async () => {
    if (!userReward || userReward.status !== 'PENDING') return;

    setIsClaiming(true);
    try {
      const result = await claimReward(userReward.id);
      if (result.success) {
        setClaimSuccess(true);
        setTimeout(() => {
          onRewardClaimed();
          onClose();
          setClaimSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('보상 수령 실패:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">보상 수령</h2>
              <p className="text-sm text-gray-600">{challengeTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {claimSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">보상 수령 완료!</h3>
              <p className="text-gray-600">
                {userReward?.amount.toLocaleString()} 크레딧이 지갑에 추가되었습니다.
              </p>
            </div>
          ) : userReward ? (
            <div className="space-y-6">
              {/* 보상 정보 */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">
                  {getRankIcon(userReward.rank)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {getRankText(userReward.rank)} 보상
                </h3>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {userReward.amount.toLocaleString()} 크레딧
                </div>
                <p className="text-sm text-gray-600">
                  챌린지 종료를 축하합니다! 🎉
                </p>
              </div>

              {/* 보상 규칙 안내 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">보상 규칙</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥇</span>
                    <span>1등: 10,000 크레딧</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥈</span>
                    <span>2등: 5,000 크레딧</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥉</span>
                    <span>3등: 3,000 크레딧</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎖</span>
                    <span>참가자 전원: 500 크레딧</span>
                  </div>
                </div>
              </div>

              {/* 수령 버튼 */}
              <button
                onClick={handleClaimReward}
                disabled={isClaiming || userReward.status !== 'PENDING'}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isClaiming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    수령 중...
                  </>
                ) : userReward.status === 'CLAIMED' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    이미 수령함
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    보상 수령하기
                  </>
                )}
              </button>

              {/* 크레딧 지갑 안내 */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  수령한 크레딧은 프로필의 크레딧 지갑에서 확인할 수 있습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">보상 정보 없음</h3>
              <p className="text-gray-600">
                이 챌린지에 대한 보상 정보를 찾을 수 없습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

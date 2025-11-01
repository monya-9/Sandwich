// src/components/Profile/CreditWallet.tsx
import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, History, ChevronRight } from 'lucide-react';
import { fetchMyCredits, fetchMyRewards, type CreditBalance, type RewardResponse, type RewardItem } from '../../api/challenge_creditApi';

export default function CreditWallet() {
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [rewards, setRewards] = useState<RewardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [creditsData, rewardsData] = await Promise.all([
          fetchMyCredits(),
          fetchMyRewards()
        ]);
        setCredits(creditsData);
        setRewards(rewardsData);
      } catch (error) {
        console.error('크레딧 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="mt-6 text-[14px] md:text-[16px]">
        <div className="text-black/90 dark:text-white">크레딧 지갑</div>
        <div className="mt-4 flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const recentRewards = rewards?.slice(0, 3) || [];

  return (
    <div className="mt-6 text-[14px] md:text-[16px]">
      <div className="flex items-center justify-between">
        <div className="text-black/90 dark:text-white">크레딧 지갑</div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-[12px] text-black/50 dark:text-white/60 hover:underline flex items-center gap-1"
        >
          {showDetails ? '접기' : '자세히 보기'}
          <ChevronRight className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* 크레딧 잔액 */}
      <div className="mt-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[12px] text-gray-600 dark:text-gray-400">총 크레딧</div>
            <div className="text-[20px] font-bold text-gray-900 dark:text-white">
              {credits?.balance?.toLocaleString() || 0} 크레딧
            </div>
          </div>
        </div>
        
        {recentRewards.length > 0 && (
          <div className="flex items-center gap-2 text-[12px] text-orange-600 dark:text-orange-400">
            <TrendingUp className="w-3 h-3" />
            <span>최근 챌린지 보상 {recentRewards.length}개</span>
          </div>
        )}
      </div>

      {/* 최근 챌린지 보상 */}
      {showDetails && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-400">
            <History className="w-3 h-3" />
            <span>최근 챌린지 보상</span>
          </div>
          
          {recentRewards.length > 0 ? (
            <div className="space-y-2">
              {recentRewards.map((reward: RewardItem) => (
                <div key={reward.challenge_id} className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-lg">
                        {reward.rank === 1 ? '🥇' : reward.rank === 2 ? '🥈' : reward.rank === 3 ? '🥉' : '🎖'}
                      </div>
                      <div className="text-[13px] font-semibold text-gray-900 dark:text-white">
                        {reward.challenge_title}
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      {new Date(reward.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-bold text-orange-600 dark:text-orange-400">
                      +{reward.amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {reward.rank === 1 ? '1등' : reward.rank === 2 ? '2등' : reward.rank === 3 ? '3등' : '참가자'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <div className="text-[12px]">챌린지 보상이 없습니다</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


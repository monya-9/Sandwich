// src/components/Profile/CreditWallet.tsx
import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, History, ChevronRight } from 'lucide-react';
import { fetchMyCredits, fetchMyRewards, type CreditBalance, type RewardResponse } from '../../api/challenge_creditApi';

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

  const recentTxns = credits?.txns?.slice(0, 3) || [];
  const pendingRewards = rewards?.rewards?.filter(r => r.status === 'PENDING').length || 0;

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
        
        {pendingRewards > 0 && (
          <div className="flex items-center gap-2 text-[12px] text-orange-600 dark:text-orange-400">
            <TrendingUp className="w-3 h-3" />
            <span>수령 대기 중인 보상 {pendingRewards}개</span>
          </div>
        )}
      </div>

      {/* 최근 거래 내역 */}
      {showDetails && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-400">
            <History className="w-3 h-3" />
            <span>최근 거래 내역</span>
          </div>
          
          {recentTxns.length > 0 ? (
            <div className="space-y-2">
              {recentTxns.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-gray-900 dark:text-white">
                      {txn.description}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      {new Date(txn.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                  <div className={`text-[13px] font-semibold ${
                    txn.type === 'EARNED' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {txn.type === 'EARNED' ? '+' : '-'}{txn.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <div className="text-[12px]">거래 내역이 없습니다</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

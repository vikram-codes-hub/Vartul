import { useState, useEffect, useCallback } from 'react';
import { fetchEngagementStatus, fetchDashboardStats } from '../api/engagement.api';

const useEngagementStatus = () => {
  const [status, setStatus] = useState({
    // Engagement
    isActive: false,
    stakeAmount: 0,
    daysStaked: 0,
    earnedTWT: 0,
    totalRewardsEarned: 0,
    lastRewardCalculation: null,
    // Wallet / TWT
    twtBalance: 0,
    available: 0,
    staked: 0,
    walletAddress: null,
    onChain: false,
    // Social
    followers: 0,
    following: 0,
    posts: 0,
    // Meta
    loading: true,
    error: null,
  });

  const checkStatus = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      // Fetch both in parallel
      const [engData, dashData] = await Promise.all([
        fetchEngagementStatus().catch(() => null),
        fetchDashboardStats().catch(() => null),
      ]);

      setStatus({
        // Engagement data
        isActive: engData?.status === 'active' || dashData?.engagement?.status === 'active',
        stakeAmount: dashData?.engagement?.stakeAmount ?? engData?.stakeAmount ?? 0,
        daysStaked: dashData?.engagement?.daysStaked ?? 0,
        earnedTWT: dashData?.engagement?.earnedTWT ?? engData?.totalRewardsEarned ?? 0,
        totalRewardsEarned: dashData?.engagement?.totalRewardsEarned ?? engData?.totalRewardsEarned ?? 0,
        lastRewardCalculation: dashData?.engagement?.lastRewardCalculation ?? null,
        // Wallet / balance data
        twtBalance: dashData?.wallet?.total ?? engData?.twtBalance ?? 0,
        available: dashData?.wallet?.available ?? 0,
        staked: dashData?.wallet?.staked ?? engData?.tokensStaked ?? 0,
        walletAddress: dashData?.wallet?.address ?? engData?.walletAddress ?? null,
        onChain: dashData?.wallet?.onChain ?? false,
        // Social stats
        followers: dashData?.social?.followers ?? 0,
        following: dashData?.social?.following ?? 0,
        posts: dashData?.social?.posts ?? 0,
        // Meta
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to fetch engagement status", error);
      setStatus(prev => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return { ...status, refreshStatus: checkStatus };
};

export default useEngagementStatus;

// ============================================================================
// Vartul Engagement Smart Contract — Rust/Anchor (Solana)
// ============================================================================
// This is the on-chain program that governs the Proof-of-Stake engagement
// system for the Vartul platform.
//
// DEPLOYMENT:
//   1. Install Anchor CLI: cargo install --git https://github.com/coral-xyz/anchor anchor-cli
//   2. Build:   anchor build
//   3. Deploy:  anchor deploy --provider.cluster devnet
//   4. Copy the program ID to your backend .env as VARTUL_PROGRAM_ID
//
// ACCOUNTS / PDAs:
//   - StakingAccount (PDA): Tracks a user's stake, start time, and epoch data
//   - VaultAccount (PDA):   Holds all staked TWT SPL tokens
//   - EngagementState:      Global state — total staked, epoch counters
//
// ============================================================================

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("AehNZSfNSq39vffKLvWouJEhuJgvPmHh6qMNB2LgpNue");

// Constants
pub const SEED_STAKING: &[u8] = b"staking";
pub const SEED_VAULT: &[u8] = b"vault";
pub const SEED_STATE: &[u8] = b"engagement_state";
pub const MIN_STAKE_DAYS: u64 = 1;
pub const PLATFORM_SHARE_BPS: u64 = 1500; // 15% in basis points

// Program
#[program]
pub mod vartul_engagement {
    use super::*;

    /// Initialize the global engagement state (run once by admin).
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.engagement_state;
        state.authority = ctx.accounts.authority.key();
        state.total_staked = 0;
        state.epoch = 0;
        state.last_epoch_time = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Stake TWT tokens to activate engagement rewards.
    /// Locks tokens in the vault PDA for `lock_duration_days` minimum.
    pub fn stake(
        ctx: Context<Stake>,
        amount: u64,
        lock_duration_days: u64,
    ) -> Result<()> {
        require!(amount > 0, VartulError::InvalidStakeAmount);
        require!(lock_duration_days >= MIN_STAKE_DAYS, VartulError::LockTooShort);

        let staking_account = &mut ctx.accounts.staking_account;
        let state = &mut ctx.accounts.engagement_state;

        // Transfer TWT from user → vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        // Update staking state
        staking_account.owner = ctx.accounts.user.key();
        staking_account.amount = amount;
        staking_account.lock_duration_days = lock_duration_days;
        staking_account.stake_start = Clock::get()?.unix_timestamp;
        staking_account.is_active = true;
        staking_account.total_rewards_earned = 0;

        // Update global total
        state.total_staked = state.total_staked.checked_add(amount).unwrap();

        emit!(StakeEvent {
            user: ctx.accounts.user.key(),
            amount,
            lock_duration_days,
            timestamp: staking_account.stake_start,
        });

        Ok(())
    }

    /// Distribute viewer rewards — called by the platform authority each epoch.
    /// r_user = r_pool * (stake / total_stake) * (watch_pct / 100) * time_multiplier
    pub fn distribute_viewer_reward(
        ctx: Context<DistributeReward>,
        watch_percentage: u64,  // 0-100 (must be >= 60 to earn)
        reward_amount: u64,     // Pre-calculated by backend per whitepaper formula
    ) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.engagement_state.authority,
            VartulError::Unauthorized
        );
        require!(watch_percentage >= 60, VartulError::InsufficientWatchTime);

        let staking_account = &mut ctx.accounts.staking_account;
        require!(staking_account.is_active, VartulError::NoActiveStake);

        // Transfer rewards from reward pool → user token account
        let state_bump = ctx.bumps.engagement_state;
        let seeds = &[SEED_STATE, &[state_bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.reward_pool.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.engagement_state.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            ),
            reward_amount,
        )?;

        staking_account.total_rewards_earned = staking_account
            .total_rewards_earned
            .checked_add(reward_amount)
            .unwrap();

        emit!(RewardEvent {
            user: staking_account.owner,
            amount: reward_amount,
            watch_percentage,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Unstake tokens after lock period expires.
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        let staking_account = &mut ctx.accounts.staking_account;
        let state = &mut ctx.accounts.engagement_state;

        require!(staking_account.is_active, VartulError::NoActiveStake);

        // Verify lock period has passed
        let now = Clock::get()?.unix_timestamp;
        let lock_seconds = (staking_account.lock_duration_days as i64) * 86400;
        let unlock_time = staking_account.stake_start + lock_seconds;
        require!(now >= unlock_time, VartulError::StillLocked);

        let amount = staking_account.amount;

        // Return tokens from vault → user
        let vault_bump = ctx.bumps.vault;
        let seeds = &[SEED_VAULT, &[vault_bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            ),
            amount,
        )?;

        staking_account.is_active = false;
        staking_account.amount = 0;
        state.total_staked = state.total_staked.saturating_sub(amount);

        emit!(UnstakeEvent {
            user: ctx.accounts.user.key(),
            amount,
            timestamp: now,
        });

        Ok(())
    }
}

// Account Structs

#[account]
pub struct EngagementState {
    pub authority: Pubkey,    // Platform admin
    pub total_staked: u64,    // Sum of all staked TWT
    pub epoch: u64,           // Current reward epoch counter
    pub last_epoch_time: i64, // Unix timestamp of last epoch
}

#[account]
pub struct StakingAccount {
    pub owner: Pubkey,
    pub amount: u64,
    pub lock_duration_days: u64,
    pub stake_start: i64,
    pub is_active: bool,
    pub total_rewards_earned: u64,
}

// Contexts

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8 + 8 + 8, seeds = [SEED_STATE], bump)]
    pub engagement_state: Account<'info, EngagementState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(init_if_needed, payer = user, space = 8 + 32 + 8 + 8 + 8 + 1 + 8, seeds = [SEED_STAKING, user.key().as_ref()], bump)]
    pub staking_account: Account<'info, StakingAccount>,
    #[account(mut, seeds = [SEED_STATE], bump)]
    pub engagement_state: Account<'info, EngagementState>,
    #[account(mut, seeds = [SEED_VAULT], bump, token::mint = twt_mint, token::authority = vault)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    /// CHECK: TWT mint address validated upstream
    pub twt_mint: AccountInfo<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeReward<'info> {
    #[account(mut, seeds = [SEED_STAKING, staking_account.owner.as_ref()], bump)]
    pub staking_account: Account<'info, StakingAccount>,
    #[account(mut, seeds = [SEED_STATE], bump)]
    pub engagement_state: Account<'info, EngagementState>,
    #[account(mut)]
    pub reward_pool: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut, seeds = [SEED_STAKING, user.key().as_ref()], bump, has_one = owner)]
    pub staking_account: Account<'info, StakingAccount>,
    #[account(mut, seeds = [SEED_STATE], bump)]
    pub engagement_state: Account<'info, EngagementState>,
    #[account(mut, seeds = [SEED_VAULT], bump)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: owner field validated by has_one constraint
    pub owner: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

// Events

#[event]
pub struct StakeEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub lock_duration_days: u64,
    pub timestamp: i64,
}

#[event]
pub struct RewardEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub watch_percentage: u64,
    pub timestamp: i64,
}

#[event]
pub struct UnstakeEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

// Errors

#[error_code]
pub enum VartulError {
    #[msg("Stake amount must be greater than zero")]
    InvalidStakeAmount,
    #[msg("Minimum lock duration is 1 day")]
    LockTooShort,
    #[msg("No active stake found for this wallet")]
    NoActiveStake,
    #[msg("Stake is still locked — unlock time has not been reached")]
    StillLocked,
    #[msg("Watch time percentage must be >= 60% to earn rewards")]
    InsufficientWatchTime,
    #[msg("Caller is not authorized")]
    Unauthorized,
}

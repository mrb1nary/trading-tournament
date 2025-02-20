
use anchor_lang::prelude::*;

pub mod state;

pub use state::*;

declare_id!("5o3NtP3cm4YbGw6oFXg7fZK2TiZqHnuDGfVxdZrv4CwB"); // Replace with your program ID

#[program]
pub mod trading_competition {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn create_competition(ctx: Context<CreateCompetition>, entry_fee: u64, base_amount: u64, start_time: i64, end_time: i64, category: String) -> Result<()> {
        Ok(())
    }

    pub fn register_player(ctx: Context<RegisterPlayer>) -> Result<()> {
        Ok(())
    }

    // Potentially remove this function
    pub fn report_trade(ctx: Context<ReportTrade>) -> Result<()> {
        Ok(())
    }

    pub fn determine_winner(ctx: Context<DetermineWinner>) -> Result<()> {
        Ok(())
    }

    pub fn close_competition(ctx: Context<CloseCompetition>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct CreateCompetition<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(init, payer = authority, space = 8 + 64)]
    pub competition: Account<'info, Competition>,
}

#[derive(Accounts)]
pub struct RegisterPlayer<'info> {
    #[account(mut)]
    pub competition: Account<'info, Competition>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(init, payer = player, space = 8 + 64)]
    pub player_account: Account<'info, Player>,
}

#[derive(Accounts)]
pub struct ReportTrade {}

#[derive(Accounts)]
pub struct DetermineWinner {}

#[derive(Accounts)]
pub struct CloseCompetition {}





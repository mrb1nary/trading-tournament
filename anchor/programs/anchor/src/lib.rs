use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

pub use instructions::*;
pub use state::*;

declare_id!("5o3NtP3cm4YbGw6oFXg7fZK2TiZqHnuDGfVxdZrv4CwB"); // Replace with your program ID

#[program]
pub mod trading_competition {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize_handler(ctx)
    }

    pub fn create_competition(
        ctx: Context<CreateCompetition>,
        entry_fee: u64,
        base_amount: u64,
        start_time: i64,
        end_time: i64,
        category: String,
    ) -> Result<()> {
        create_competition_handler(ctx, entry_fee, base_amount, start_time, end_time, category)
    }

    pub fn register_player(ctx: Context<RegisterPlayer>) -> Result<()> {
        register_player_handler(ctx)
    }

    // We can do this maybe in upcoming versions
    pub fn report_trade(ctx: Context<ReportTrade>) -> Result<()> {
        report_trade_handler(ctx)
    }

    pub fn determine_winner(ctx: Context<DetermineWinner>) -> Result<()> {
        determine_winner_handler(ctx)
    }

    pub fn close_competition(ctx: Context<CloseCompetition>) -> Result<()> {
        close_competition_handler(ctx)
    }
}

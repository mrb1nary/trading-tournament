use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

pub use error::*;
pub use instructions::*;
pub use state::*;

declare_id!("1wSNjNqx37H5y3F9nA3JejzBDw3eCDE6hqpD6fEYg33");

#[program]
pub mod trading_competition {
    use super::*;

    pub fn signup_player(ctx: Context<Signup>) -> Result<()> {
        signup_player_handler(ctx)
    }

    pub fn create_competition(
        ctx: Context<CreateCompetition>,
        id: u32,
        entry_fee: u64,
        base_amount: u64,
        start_time: i64,
        winning_amount: u64,
        end_time: i64,
        category: CompetitionCategory,
    ) -> Result<()> {
        create_competition_handler(
            ctx,
            id,
            entry_fee,
            base_amount,
            start_time,
            winning_amount,
            end_time,
            category,
        )
    }

    pub fn register_player(
        ctx: Context<RegisterPlayer>,
        competition_id: u32,
        current_usdt_balance: u64,
    ) -> Result<()> {
        register_player_handler(ctx, competition_id, current_usdt_balance)
    }

    pub fn determine_winner(
        ctx: Context<DetermineWinner>,
        competition_id: u32,
        winner_key: Pubkey,
        winning_amount: u64,
    ) -> Result<()> {
        determine_winner_handler(ctx, competition_id, winner_key, winning_amount)
    }

    pub fn close_competition(ctx: Context<CloseCompetition>, competition_id: u32) -> Result<()> {
        close_competition_handler(ctx, competition_id)
    }
}

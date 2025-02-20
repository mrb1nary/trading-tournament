use anchor_lang::prelude::*;

use crate::state::competition::Competition;

#[derive(Accounts)]
pub struct CreateCompetition<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(init, payer = authority, space = 8 + 64)]
    pub competition: Account<'info, Competition>,
}

pub fn create_competition_handler(
    ctx: Context<CreateCompetition>,
    entry_fee: u64,
    base_amount: u64,
    start_time: i64,
    end_time: i64,
    category: String,
) -> Result<()> {
    Ok(())
}

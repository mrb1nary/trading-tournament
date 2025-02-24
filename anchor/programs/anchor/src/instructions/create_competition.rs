use anchor_lang::prelude::*;

use crate::state::competition::*;

#[derive(Accounts)]
#[instruction(id: u32)]
pub struct CreateCompetition<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = 8+Competition::INIT_SPACE, seeds = [&id.to_le_bytes()], bump)]
    pub competition: Account<'info, Competition>,
    pub system_program: Program<'info, System>,
}

pub fn create_competition_handler(
    ctx: Context<CreateCompetition>,
    id: u32,
    entry_fee: u64,
    base_amount: u64,
    start_time: i64,
    winning_amount: u64,
    end_time: i64,
    category: CompetitionCategory,
) -> Result<()> {
    let competition = &mut ctx.accounts.competition;

    competition.authority = *ctx.accounts.authority.key;
    competition.id = id;
    competition.entry_fee = entry_fee;
    competition.base_amount = base_amount;
    competition.start_time = start_time;
    competition.end_time = end_time;
    competition.category = category;
    competition.winner = Pubkey::default(); // Zeroed out initially
    competition.winning_amount = winning_amount;
    competition.payout_claimed = false;
    competition.current_players = 0;
    competition.max_players = match category {
        CompetitionCategory::SixPlayers => 6,
        CompetitionCategory::TwelvePlayers => 12,
        CompetitionCategory::TwentyFivePlayers => 25,
    };

    competition.bump = ctx.bumps.competition;

    Ok(())
}

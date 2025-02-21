use anchor_lang::prelude::*;

use crate::state::*;
use crate::ErrorCodes::*;

#[derive(Accounts)]
#[instruction(competition_id: u32)]
pub struct CloseCompetition<'info> {
    #[account(
        mut,
        seeds = [competition_id.to_le_bytes().as_ref()],
        bump = competition.bump,
        close = authority, // Close the account and send the remaining SOL to the authority
        constraint = competition.payout_claimed == true,
        constraint = competition.winner != Pubkey::default(),
        constraint = competition.authority == authority.key()
    )]
    pub competition: Account<'info, Competition>,
    
    #[account(mut)]
    pub master_treasury: Account<'info, master_treasury>,
    /// CHECK: The authority of the competition (likely the program itself).  This account receives the remaining SOL.
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn close_competition_handler(
    ctx: Context<CloseCompetition>,
    competition_id: u32,
) -> Result<()> {
    let competition = &ctx.accounts.competition;
    let master_treasury = &mut ctx.accounts.master_treasury.to_account_info();
    let authority = &ctx.accounts.authority;

    // Calculate the remaining SOL in the competition account
    let lamports = competition.to_account_info().lamports();

    // Transfer the remaining SOL to the master treasury
    **master_treasury.try_borrow_mut_lamports()? += lamports;
    **competition.to_account_info().try_borrow_mut_lamports()? = 0;

    msg!("Transferred {} lamports to master treasury", lamports);
    msg!("Competition account closed");

    Ok(())
}

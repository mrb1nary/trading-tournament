use anchor_lang::prelude::*;
use anchor_spl::associated_token::{AssociatedToken};
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};

use crate::error::ErrorCodes;
use crate::state::*;

const EXPECTED_USDT_MINT: &str = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

#[derive(Accounts)]
#[instruction(competition_id: u32)]
pub struct CloseCompetition<'info> {
    #[account(
        mut,
        seeds = [&competition_id.to_le_bytes()],
        bump = competition.bump,
        close = authority,
        // constraint = competition.payout_claimed == true,
        // constraint = competition.winner != Pubkey::default(),
        // constraint = competition.authority == authority.key()
    )]
    pub competition: Account<'info, Competition>,

    #[account(mut)]
    pub competition_ata: Account<'info, TokenAccount>, // The competition's ATA holding USDT

    /// CHECK: The master treasury account (PDA or admin wallet)
    #[account(mut)]
    pub master_treasury: Signer<'info>, // Authority of the treasury

    #[account(
        init_if_needed,
        payer = master_treasury,
        associated_token::mint = usdt_mint,
        associated_token::authority = master_treasury
    )]
    pub master_treasury_ata: Account<'info, TokenAccount>, // The master treasury's ATA for USDT

    /// CHECK: The USDT mint address
    // #[account(constraint = usdt_mint.key() == Pubkey::try_from(EXPECTED_USDT_MINT).unwrap())]
    pub usdt_mint: Account<'info, Mint>,

    pub authority: Signer<'info>, // Authority to close the competition
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn close_competition_handler(
    ctx: Context<CloseCompetition>,
    competition_id: u32,
) -> Result<()> {
    let competition = &ctx.accounts.competition;
    let competition_ata = &ctx.accounts.competition_ata;
    let master_treasury_ata = &ctx.accounts.master_treasury_ata;

    // Ensure that the competition has ended and is ready to close
    let clock = Clock::get()?;
    if clock.unix_timestamp < competition.end_time {
        return Err(ErrorCodes::CompetitionNotEnded.into());
    }

    // Calculate remaining USDT in the competition's ATA
    let remaining_usdt_amount = competition_ata.amount; // Get amount from competition's ATA

    if remaining_usdt_amount > 0 {
        // Transfer remaining USDT to master treasury's ATA
        let cpi_accounts = Transfer {
            from: competition_ata.to_account_info(),
            to: master_treasury_ata.to_account_info(),
            authority: ctx.accounts.competition.to_account_info(), // Authority is the competition account
        };

        let binding = competition_id.to_le_bytes();
        let seeds = &[binding.as_ref(), &[ctx.accounts.competition.bump]];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        anchor_spl::token::transfer(cpi_context, remaining_usdt_amount)?;

        msg!(
            "Transferred {} USDT to master treasury",
            remaining_usdt_amount
        );
    } else {
        msg!("No remaining USDT in the competition's ATA.");
    }

    msg!("Competition {} closed successfully", competition_id);

    Ok(())
}

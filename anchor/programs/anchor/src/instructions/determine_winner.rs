use anchor_lang::prelude::*;
use anchor_spl::associated_token::{self, AssociatedToken};
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};

use crate::error::ErrorCodes;
use crate::state::{Competition, PlayerProfile};

const EXPECTED_USDT_MINT: &str = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"; // USDT MINT address on Solana

#[derive(Accounts)]
#[instruction(competition_id: u32, winner_profile_key: Pubkey)]
pub struct DetermineWinner<'info> {
    #[account(
        seeds = [competition_id.to_le_bytes().as_ref()],
        bump = competition.bump,
    )]
    pub competition: Account<'info, Competition>,

    /// CHECK: The authority (creator) of the competition
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"profile".as_ref(), winner_profile_key.as_ref()],
        bump,
    )]
    pub winner_profile: Account<'info, PlayerProfile>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = usdt_mint,
        associated_token::authority = winner_profile,
        associated_token::token_program = token_program,
    )]
    pub winner_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub competition_ata: Account<'info, TokenAccount>,

    // CHECK: The USDT mint address
    // #[account(constraint = usdt_mint.key() == Pubkey::try_from(EXPECTED_USDT_MINT).unwrap())]
    #[account(mut)]
    pub usdt_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn determine_winner_handler(
    ctx: Context<DetermineWinner>,
    competition_id: u32,
    winner_profile_key: Pubkey,
    winning_amount: u64,
) -> Result<()> {
    let competition = &mut ctx.accounts.competition;

    let current_time = Clock::get()?.unix_timestamp;
    if current_time < competition.end_time {
        return Err(ErrorCodes::CompetitionNotEnded.into());
    }

    let expected_competition_ata =
        derive_competition_ata(competition.authority, ctx.accounts.usdt_mint.key());

    // Check if the provided competition ATA matches the expected one
    if ctx.accounts.competition_ata.key() != expected_competition_ata {
        return Err(ErrorCodes::InvalidATA.into());
    }
    //  verify authority
    if competition.authority != ctx.accounts.authority.key() {
        return Err(ErrorCodes::IncorrectAuthority.into());
    }

    // 1.  Transfer winning amount to the winner's ATA
    let cpi_accounts = Transfer {
        from: ctx.accounts.competition_ata.to_account_info(),
        to: ctx.accounts.winner_ata.to_account_info(),
        authority: ctx.accounts.competition.to_account_info(), // Competition account is the authority
    };

    let binding = competition_id.to_le_bytes();
    let seeds = &[binding.as_ref(), &[ctx.accounts.competition.bump]];
    let signer_seeds = &[&seeds[..]];

    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );

    competition.payout_claimed = true;
    competition.winner = winner_profile_key;

    anchor_spl::token::transfer(cpi_context, winning_amount)?;

    msg!(
        "Transferred {} USDT to winner {}",
        winning_amount,
        ctx.accounts.winner_profile.key()
    );

    msg!("Winner set: {}", competition.winner);
    msg!("Payout Claimed: {}", competition.payout_claimed);

    Ok(())
}

pub fn derive_competition_ata(competition_authority: Pubkey, usdt_mint: Pubkey) -> Pubkey {
    let seeds = &[b"token", competition_authority.as_ref(), usdt_mint.as_ref()];
    let (ata, _) = Pubkey::find_program_address(seeds, &associated_token::ID);
    ata
}

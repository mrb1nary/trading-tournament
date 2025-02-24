use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;



use crate::state::{Competition, Player};
use crate::error::ErrorCodes;

const EXPECTED_USDT_MINT: &str = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"; // USDT MINT address on Solana

#[derive(Accounts)]
#[instruction(competition_id: u32)]
pub struct DetermineWinner<'info> {
    #[account(
        seeds = [competition_id.to_le_bytes().as_ref()],
        bump = competition.bump
    )]
    pub competition: Account<'info, Competition>,

    #[account(mut)]
    pub winner: Signer<'info>, // The winner's account

    #[account(
        init_if_needed,
        payer = winner,
        associated_token::mint = usdt_mint,
        associated_token::authority = winner,
        associated_token::token_program = token_program,
    )]
    pub winner_ata: Account<'info, TokenAccount>, // Winner's ATA for USDT

    #[account(mut)]
    pub competition_ata: Account<'info, TokenAccount>, // Competition's ATA holding USDT

    /// CHECK: The USDT mint address
    #[account(constraint = usdt_mint.key() == Pubkey::try_from(EXPECTED_USDT_MINT).unwrap())]
    pub usdt_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn determine_winner_handler(
    ctx: Context<DetermineWinner>,
    winning_amount: u64,
) -> Result<()> {
    let competition = &ctx.accounts.competition;
    
    // Check if the winner is valid (this should be done based on your logic)
    // For example, you might want to ensure that the winner is a registered player in this competition.
    
    // 1. Check if the winner has an ATA for USDT
    let winner_ata = &ctx.accounts.winner_ata;

    // 2. Transfer winning amount to the winner's ATA
    let cpi_accounts = anchor_spl::token::Transfer {
        from: ctx.accounts.competition_ata.to_account_info(), // From competition's ATA
        to: winner_ata.to_account_info(), // To winner's ATA
        authority: ctx.accounts.competition.to_account_info(), // Authority is the competition account
    };

    let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    
    // Transfer winning amount to the winner's ATA
    anchor_spl::token::transfer(cpi_context, winning_amount)?;

    msg!("Transferred {} USDT to {}", winning_amount, ctx.accounts.winner.key());

    Ok(())
}

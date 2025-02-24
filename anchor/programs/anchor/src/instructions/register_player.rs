use anchor_lang::prelude::*;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::error::ErrorCodes;
use crate::state::{competition::Competition, player::Player};

const EXPECTED_USDT_MINT: &str = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"; // USDT MINT address on Solana

#[derive(Accounts)]
#[instruction(competition_id: u32)]
pub struct RegisterPlayer<'info> {
    #[account(mut,
        seeds = [competition_id.to_le_bytes().as_ref()],
        bump = competition.bump
    )]
    pub competition: Account<'info, Competition>,
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: The USDT mint address for the competition
    #[account(mut, constraint = usdt_mint.key() == Pubkey::try_from(EXPECTED_USDT_MINT).unwrap())]
    pub usdt_mint: Account<'info, Mint>,

    // Create an ATA for the competition account
    #[account(
        init_if_needed,
        payer = player,
        associated_token::mint = usdt_mint,
        associated_token::authority = competition,
        associated_token::token_program = token_program,
    )]
    pub competition_ata: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = player,
        space = 8 + 32 + 32 + 8 + 8 + 1,
        seeds = [b"player", competition.key().as_ref(), player.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, Player>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn register_player_handler(
    ctx: Context<RegisterPlayer>,
    competition_id: u32,
    current_usdt_balance: u64,
) -> Result<()> {
    let competition = &mut ctx.accounts.competition;
    let player_account = &mut ctx.accounts.player_account;

    if competition.current_players >= competition.max_players {
        return Err(ErrorCodes::TooManyPlayers.into());
    }

    if player_account.participating_in_other_competition {
        return Err(ErrorCodes::AlreadyParticipant.into());
    }

    // 1. Transfer entry fee from player to the competition's ATA (in USDT).

    let cpi_accounts = anchor_spl::token::Transfer {
        from: ctx.accounts.player.to_account_info(),
        to: ctx.accounts.competition_ata.to_account_info(),
        authority: ctx.accounts.player.to_account_info(),
    };

    let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    // Assuming entry_fee is in USDT and already set in the competition account
    anchor_spl::token::transfer(cpi_context, competition.entry_fee)?;

    // 3. Initialize the Player Account
    player_account.competition_id = competition_id;
    player_account.player = ctx.accounts.player.key();
    player_account.base_balance = competition.base_amount;
    player_account.current_balance = current_usdt_balance;
    player_account.bump = ctx.bumps.player_account;
    player_account.participating_in_other_competition = true;

    // 4. Update the competition's player count
    competition.current_players += 1;

    msg!(
        "Player {} registered for competition {}",
        ctx.accounts.player.key(),
        competition.key()
    );

    Ok(())
}

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount, Transfer};

use crate::error::ErrorCodes;
use crate::state::{competition::Competition, player::Player, player_profile::PlayerProfile};

const EXPECTED_USDT_MINT: &str = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"; // USDT MINT address on Solana

#[derive(Accounts)]
#[instruction(competition_id: u32)]
pub struct RegisterPlayer<'info> {
    #[account(
        mut,
        seeds = [&competition_id.to_le_bytes()],
        bump = competition.bump,
        constraint = competition.current_players < competition.max_players @ ErrorCodes::TooManyPlayers
    )]
    pub competition: Account<'info, Competition>,

    #[account(mut)]
    pub player: Signer<'info>,

    #[account(mut, constraint = usdt_mint.key() == Pubkey::try_from(EXPECTED_USDT_MINT).unwrap())]
    pub usdt_mint: Account<'info, Mint>,

    // Player's Associated Token Account (ATA)
    #[account(
        mut,
        associated_token::mint = usdt_mint,
        associated_token::authority = player
    )]
    pub player_ata: Account<'info, TokenAccount>,

    // Competition's Associated Token Account (ATA)
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
        space = 8 + 4 + 32 + 8 + 8 + 1,
        seeds = [b"player", competition.key().as_ref(), player.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, Player>,

    #[account(
        mut,
        seeds = [b"profile", player.key().as_ref()],
        bump,
        constraint = !player_profile.participating_in_other_competition @ ErrorCodes::AlreadyParticipant
    )]
    pub player_profile: Account<'info, PlayerProfile>,

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
    let player_profile = &mut ctx.accounts.player_profile;

    // Check if competition has reached max players
    if competition.current_players >= competition.max_players {
        return Err(ErrorCodes::TooManyPlayers.into());
    }

    // Transfer entry fee from player's ATA to competition's ATA
    let cpi_accounts = Transfer {
        from: ctx.accounts.player_ata.to_account_info(),
        to: ctx.accounts.competition_ata.to_account_info(),
        authority: ctx.accounts.player.to_account_info(),
    };

    let cpi_context = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    // Transfer entry fee (in USDT)
    anchor_spl::token::transfer(cpi_context, competition.entry_fee)?;

    // Initialize the Player Account
    player_account.competition_id = competition_id;
    player_account.player = ctx.accounts.player.key();
    player_account.base_balance = competition.base_amount;
    player_account.current_balance = current_usdt_balance;
    player_account.bump = ctx.bumps.player_account;

    // Mark the player's profile as participating in another competition
    player_profile.participating_in_other_competition = true;

    // Increment the number of players in the competition
    competition.current_players += 1;

    // Add the player's Pubkey to the competition's participants array
    let current_players = competition.current_players as usize;
    if current_players < competition.max_players as usize {
        competition.participants[current_players] = ctx.accounts.player.key();
    } else {
        return Err(ErrorCodes::CompetitionFull.into());
    }

    msg!(
        "Player {} registered for competition {}",
        ctx.accounts.player.key(),
        competition.key()
    );

    Ok(())
}

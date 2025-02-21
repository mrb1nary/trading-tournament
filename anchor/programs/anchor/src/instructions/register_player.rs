use anchor_lang::{prelude::*, system_program};

use crate::state::{competition::Competition, player::Player};


use crate::error::ErrorCodes;

#[derive(Accounts)]
#[instruction(competition_id:u32)]
pub struct RegisterPlayer<'info> {
    #[account(mut,seeds = [competition_id.to_le_bytes().as_ref()],bump)]
    pub competition: Account<'info, Competition>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(
        init,
        payer = player,
        space = 8 + 32 + 32 + 8 + 8, // Adjusted space for new fields
        seeds = [b"player".as_ref(), competition.key().as_ref(), player.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, Player>,
    #[account(mut,
        constraint = player_ata.owner == player.key(),
        constraint = player_ata.mint == competition.usdt_mint
    )]
    pub player_ata: Account<'info, anchor_spl::token::TokenAccount>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn register_player_handler(
    ctx: Context<RegisterPlayer>,
    competition_id: u32,
    current_balance: u64,
) -> Result<()> {
    let competition = &mut ctx.accounts.competition;
    let player_account = &mut ctx.accounts.player_account;

    if competition.current_players == competition.max_players {
        return Err(ErrorCodes::TooManyPlayers.into());
    }

    if player_account.participating_in_other_competition == true {
        return Err(ErrorCodes::AlreadyParticipant.into());
    }

    // 1. Transfer entry fee from player to program's treasury wallet.
    //    (You'll need to define a treasury PDA for the program in the
    //     create_competition instruction.)
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: competition.to_account_info(), //Treasury wallet
            },
        ),
        competition.entry_fee,
    )?;

    // 2. Initialize the Player Account
    player_account.competition_id = competition_id;
    player_account.player = ctx.accounts.player.key();
    player_account.base_balance = competition.base_amount;
    player_account.current_balance = current_balance;
    player_account.bump = ctx.bumps.player_account;
    player_account.participating_in_other_competition = true;

    // 3. Update the competition's player count
    competition.current_players += 1;

    msg!(
        "Player {} registered for competition {}",
        ctx.accounts.player.key(),
        competition.key()
    );

    Ok(())
}

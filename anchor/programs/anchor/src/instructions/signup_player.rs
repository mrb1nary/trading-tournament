use anchor_lang::prelude::*;

use crate::ErrorCodes;
use crate::PlayerProfile;

#[derive(Accounts)]
pub struct Signup<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        space = PlayerProfile::INIT_SPACE,
        seeds = [b"profile", signer.key().as_ref()],
        bump
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    pub system_program: Program<'info, System>,
}

pub fn signup_player_handler(
    ctx: Context<Signup>,
    player_name: String,
    player_email: String,
    player_dob: String,
) -> Result<()> {
    let player_profile = &mut ctx.accounts.player_profile;

    // Input validation
    if player_name.len() > 20 {
        return Err(error!(ErrorCodes::PlayerNameTooLong));
    }

    if player_email.len() > 50 {
        return Err(error!(ErrorCodes::PlayerEmailTooLong));
    }

    if player_dob.len() > 10 {
        return Err(error!(ErrorCodes::PlayerDobTooLong));
    }

    // Assign data to the PlayerProfile account
    player_profile.player_name = player_name;
    player_profile.player_wallet_address = *ctx.accounts.signer.key;
    player_profile.player_email = player_email;
    player_profile.player_dob = player_dob;
    player_profile.participating_in_other_competition = false;

    Ok(())
}

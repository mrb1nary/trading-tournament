use anchor_lang::prelude::*;

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

pub fn signup_player_handler(ctx: Context<Signup>) -> Result<()> {
    let player_profile = &mut ctx.accounts.player_profile;

    // Assign data to the PlayerProfile account
    player_profile.player_wallet_address = *ctx.accounts.signer.key;
    player_profile.participating_in_other_competition = false;

    Ok(())
}

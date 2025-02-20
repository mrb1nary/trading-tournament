use anchor_lang::prelude::*;

use crate::state::{competition::Competition, player::Player};

#[derive(Accounts)]
pub struct RegisterPlayer<'info> {
    #[account(mut)]
    pub competition: Account<'info, Competition>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(init, payer = player, space = 8 + 64)]
    pub player_account: Account<'info, Player>,
}

pub fn register_player_handler(ctx: Context<RegisterPlayer>) -> Result<()> {
    Ok(())
}

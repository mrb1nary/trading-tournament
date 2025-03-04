use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PlayerProfile {
    pub player_wallet_address: Pubkey,
    pub participating_in_other_competition: bool,
}

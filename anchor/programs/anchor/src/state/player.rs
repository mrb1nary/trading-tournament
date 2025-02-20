use anchor_lang::prelude::*;

#[account]
pub struct Player {
    pub competition: Pubkey,
    pub player: Pubkey,
    pub initial_balance: u64,
    pub current_balance: u64,
}

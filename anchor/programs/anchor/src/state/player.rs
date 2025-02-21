use anchor_lang::prelude::*;

#[account]
pub struct Player {
    pub competition_id: u32,
    pub player: Pubkey,
    pub base_balance: u64,
    pub current_balance: u64,
    pub bump: u8,
    pub participating_in_other_competition: bool,
}

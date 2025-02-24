use anchor_lang::prelude::*;
#[account]
pub struct master_treasury {
    pub total_amount_collected: u64,
    pub withdraw_authority: Pubkey,
}

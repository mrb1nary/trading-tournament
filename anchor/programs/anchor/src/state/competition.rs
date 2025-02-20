#[account]
pub struct Competition {
    pub authority: Pubkey,
    pub entry_fee: u64,
    pub base_amount: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub category: String,
    pub winner: Pubkey,
}

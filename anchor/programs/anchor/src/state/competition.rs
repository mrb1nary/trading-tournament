use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, PartialEq, Eq)]
pub enum CompetitionCategory {
    SixPlayers,
    TwelvePlayers,
    TwentyFivePlayers,
}
#[account]
pub struct Competition {
    pub authority: Pubkey,
    pub id: u32,
    pub max_players: u8,
    pub current_players: u8,
    pub entry_fee: u64,
    pub base_amount: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub winning_amount: u64,
    pub category: CompetitionCategory,
    pub winner: Pubkey,
    pub payout_claimed: bool,
    pub bump: u8,
}

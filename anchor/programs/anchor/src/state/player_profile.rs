use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PlayerProfile {
    #[max_len(20)]
    pub player_name: String,
    pub player_wallet_address: Pubkey,
    #[max_len(50)]
    pub player_email: String,
    #[max_len(10)]
    pub player_dob: String, // Storing as String for simplicity; consider more robust date handling
    pub participating_in_other_competition: bool,
}

const MAX_PLAYER_NAME_LENGTH: usize = 20;
const MAX_PLAYER_EMAIL_LENGTH: usize = 50;
const MAX_PLAYER_DOB_LENGTH: usize = 10;

impl PlayerProfile {
    pub fn space() -> usize {
        8 // Discriminator
        + 4 + MAX_PLAYER_NAME_LENGTH 
        + 32 // player_wallet_address: Pubkey
        + 4 + MAX_PLAYER_EMAIL_LENGTH 
        + 4 + MAX_PLAYER_DOB_LENGTH 
    }
}

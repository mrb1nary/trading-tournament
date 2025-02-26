use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCodes {
    #[msg("Too many players")]
    TooManyPlayers,
    #[msg("Competition is full")]
    CompetitionFull,
    #[msg("Competition has already started")]
    CompetitionStarted,
    #[msg("Associated Token Account is invalid")]
    InvalidATA,
    #[msg("Incorrect Mint Address")]
    IncorrectMint,
    #[msg("Player already participating in another competition")]
    AlreadyParticipant,
    #[msg("Competition not ended yet!")]
    CompetitionNotEnded,
    #[msg("Player name is too long. Maximum length is 20 characters.")]
    PlayerNameTooLong,
    #[msg("Player email is too long. Maximum length is 50 characters.")]
    PlayerEmailTooLong,
    #[msg("Player date of birth is too long. Maximum length is 10 characters.")]
    PlayerDobTooLong,
    #[msg("Incorrect Authority")]
    IncorrectAuthority,
}

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
}

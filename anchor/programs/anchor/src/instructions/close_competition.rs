use anchor_lang::prelude::*;



#[derive(Accounts)]
pub struct CloseCompetition {}

pub fn close_competition_handler(ctx: Context<CloseCompetition>) -> Result<()> {
    Ok(())
}

use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize {}

pub fn initialize_handler(ctx: Context<Initialize>) -> Result<()> {
    Ok(())
}

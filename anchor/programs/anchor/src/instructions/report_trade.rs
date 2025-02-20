use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ReportTrade {}

pub fn report_trade_handler(ctx: Context<ReportTrade>) -> Result<()> {
    Ok(())
}

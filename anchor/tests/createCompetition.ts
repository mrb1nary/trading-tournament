import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { TradingCompetition } from "../target/types/trading_competition"; // Adjust this import
import * as web3 from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

describe("TradingCompetition", () => {
  const program = anchor.workspace
    .TradingCompetition as Program<TradingCompetition>;
  const user = (provider.wallet as anchor.Wallet).payer;

  const competitionId = 7; // Example competition ID (u32)
  const entryFee = new anchor.BN(100); // Example entry fee (u64)
  const baseAmount = new anchor.BN(50); // Example base amount (u64)
  const startTime = new anchor.BN(Math.floor(Date.now() / 1000)); // Current time in seconds (i64)
  const endTime = startTime.add(new anchor.BN(3600)); // End time one hour later (i64)
  const winningAmount = new anchor.BN(200); // Example winning amount (u64)
  const category = { sixPlayers: {} }; // Enum value for CompetitionCategory

  let competitionPDA: web3.PublicKey;

  before(async () => {
    
     const [pda,bump] = await web3.PublicKey.findProgramAddressSync(
       [Buffer.from(new anchor.BN(competitionId).toArray("le", 4))], // Match Rust's id.to_le_bytes()
       program.programId
     );
    competitionPDA = pda;
  });

  it("Creates a competition successfully", async () => {
    await program.methods
      .createCompetition(
        competitionId,
        entryFee,
        baseAmount,
        startTime,
        winningAmount,
        endTime,
        category
      )
      .accounts({
        authority: user.publicKey,
        competition: competitionPDA,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Fetch and verify the created competition account
    const competitionData = await program.account.competition.fetch(
      competitionPDA
    );

    assert.equal(competitionData.id.toString(), competitionId.toString());
    assert.equal(competitionData.entryFee.toString(), entryFee.toString());
    assert.equal(competitionData.baseAmount.toString(), baseAmount.toString());
    assert.equal(competitionData.startTime.toString(), startTime.toString());
    assert.equal(competitionData.endTime.toString(), endTime.toString());
    assert.equal(
      competitionData.winningAmount.toString(),
      winningAmount.toString()
    );
    assert.equal(
      competitionData.authority.toString(),
      user.publicKey.toString()
    );
  });

  it("Fails to create a competition with a duplicate ID", async () => {
    try {
      // Attempt to create a competition with the same ID (same PDA)
      await program.methods
        .createCompetition(
          competitionId, // Same ID as before
          entryFee,
          baseAmount,
          startTime,
          winningAmount,
          endTime,
          category
        )
        .accounts({
          authority: user.publicKey,
          competition: competitionPDA, 
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      // If no error is thrown, fail the test
      assert.fail("Expected error not thrown"); 
    } catch (error) {
      assert.isTrue(
        error.message.includes("already in use"),
        `Unexpected error: ${error.message}`
      );
    }
  });

  


});






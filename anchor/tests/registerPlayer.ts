import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { TradingCompetition } from "../target/types/trading_competition"; // Adjust this import
import * as web3 from "@solana/web3.js";
import { createMint, getAssociatedTokenAddress, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

describe("TradingCompetition", () => {
  const program = anchor.workspace
    .TradingCompetition as Program<TradingCompetition>;
  const user = (provider.wallet as anchor.Wallet).payer;

  const competitionId = 1; // Example competition ID (u32)
  const entryFee = new anchor.BN(100); // Example entry fee (u64)
  const baseAmount = new anchor.BN(50); // Example base amount (u64)
  const startTime = new anchor.BN(Math.floor(Date.now() / 1000)); // Current time in seconds (i64)
  const endTime = startTime.add(new anchor.BN(3600)); // End time one hour later (i64)
  const winningAmount = new anchor.BN(200); // Example winning amount (u64)
  const category = { sixPlayers: {} }; // Enum value for CompetitionCategory

  let competitionPDA: web3.PublicKey;
  let competitionATA: web3.PublicKey;
  let usdtMint: web3.PublicKey;
  let playerAccountPDA: web3.PublicKey;

  before(async () => {
    // Derive the PDA for the competition
    [competitionPDA] = await web3.PublicKey.findProgramAddressSync(
      [Buffer.from(new anchor.BN(competitionId).toArray("le", 4))],
      program.programId
    );

    // Create USDT mint for testing
    usdtMint = await createMint(
      provider.connection,
      user,
      user.publicKey,
      null,
      6,
      TOKEN_PROGRAM_ID
    );

    // Derive player account PDA
    [playerAccountPDA] = await web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("player"),
        competitionPDA.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Create associated token account for the competition
    competitionATA = await getAssociatedTokenAddress(
      usdtMint,
      competitionPDA,
      true,
      TOKEN_PROGRAM_ID
    );
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
        error.message.includes("Account already initialized"),
        `Unexpected error: ${error.message}`
      );
    }
  });

  it("Registers a player successfully", async () => {
    //Before registering a player, Mint some USDT to the user's ATA
    const userAssociatedTokenAccount = await getAssociatedTokenAddress(
      usdtMint,
      user.publicKey,
    );

    await program.methods
      .registerPlayer(competitionId, new anchor.BN(50)) // Current balance in USDT
      .accounts({
        player: user.publicKey,
        competition: competitionPDA,
        usdtMint: usdtMint,
        competitionAta: competitionATA,
        playerAccount: playerAccountPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Fetch and verify that the player account was created and updated correctly
    const playerAccountData = await program.account.player.fetch(
      playerAccountPDA
    );

    assert.equal(
      playerAccountData.competitionId.toString(),
      competitionId.toString()
    );
    assert.equal(
      playerAccountData.player.toString(),
      user.publicKey.toString()
    );
    assert.equal(
      playerAccountData.baseBalance.toString(),
      baseAmount.toString()
    );
    assert.equal(playerAccountData.currentBalance.toString(), "50"); // Assuming current balance is passed as 50

    console.log(
      `Player ${user.publicKey} registered successfully for competition ${competitionId}.`
    );
  });
});

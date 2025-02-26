import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { TradingCompetition } from "../target/types/trading_competition";
import * as web3 from "@solana/web3.js";
import {
  createAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
} from "@solana/spl-token";

describe("TradingCompetition - Close Competition", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const program = anchor.workspace
    .TradingCompetition as Program<TradingCompetition>;
  const user = (provider.wallet as anchor.Wallet).payer;

  const competitionId = 1;
  const entryFee = new anchor.BN(100);
  const baseAmount = new anchor.BN(50);
  const winningAmountBN = new anchor.BN(1000); // Use `anchor.BN` for winning amount
  const category = { sixPlayers: {} };

  let competitionPDA: web3.PublicKey;
  let usdtMint: web3.PublicKey;
  let competitionATA: web3.PublicKey;
  let masterTreasuryATA: web3.PublicKey;

  let startTime: anchor.BN;
  let endTime: anchor.BN;

  before(async () => {
    startTime = new anchor.BN(Math.floor(Date.now() / 1000));
    endTime = startTime.add(new anchor.BN(10)); // Competition ends 10 seconds after start time

    try {
      // Create USDT mint
      usdtMint = await createMint(
        connection,
        user, // payer
        user.publicKey, // mint authority
        null, // freeze authority
        6 // number of decimals
      );

      // Derive the PDA for the competition
      [competitionPDA] = await web3.PublicKey.findProgramAddressSync(
        [Buffer.from(new anchor.BN(competitionId).toArray("le", 4))],
        program.programId
      );

      console.log("Competition PDA:", competitionPDA.toBase58());

      // Create the competition
      await program.methods
        .createCompetition(
          competitionId, // Competition ID
          entryFee,
          baseAmount,
          startTime,
          winningAmountBN,
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

      console.log(`Competition created successfully.`);

      // Create associated token account for the competition
      competitionATA = await createAssociatedTokenAccount(
        connection,
        user,
        usdtMint, // Mint address
        competitionPDA,
        undefined, // Optional confirm options
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
        true // Set allowOwnerOffCurve to true
      );

      console.log("Competition ATA:", competitionATA.toBase58());

      // Mint some USDT to the competition ATA for testing purposes
      await mintTo(
        program.provider.connection,
        user,
        usdtMint,
        competitionATA,
        user.publicKey, // Mint authority is the user in this test setup
        2000, // Minting 2000 tokens for testing purposes
        [],
        undefined,
        TOKEN_PROGRAM_ID
      );
      console.log("Minted USDT to Competition ATA");

      // Create associated token account for master treasury
      masterTreasuryATA = await createAssociatedTokenAccount(
        connection,
        user,
        usdtMint, // Mint address
        user.publicKey, // Master treasury authority (user in this test setup)
        undefined, // Optional confirm options
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      console.log("Master Treasury ATA:", masterTreasuryATA.toBase58());


    

  
    } catch (error) {
      console.error("Error in before hook:", error);
    }
  });

  it("Fails to close the competition before end time", async () => {
    try {
      await program.methods
        .closeCompetition(competitionId) // Correct argument for closeCompetition handler
        .accounts({
          competition: competitionPDA,
          competitionAta: competitionATA, // Competition's ATA holding USDT tokens
          authority: user.publicKey, // Authority of the competition (creator)
          masterTreasuryAta: masterTreasuryATA, // Master treasury's ATA for USDT mint
          masterTreasury: user.publicKey, // Master treasury authority (user in this test setup)
          usdtMint: usdtMint, // USDT mint address
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      assert.fail("Expected error not thrown");
    } catch (error) {
      assert.isTrue(
        error.message.includes("not ended"),
        `Unexpected error message received: ${error.message}`
      );
    }
  });

  it("Closes the competition successfully after end time", async () => {
    console.log("Waiting for the competition to end...");
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

    
      await program.methods
        .closeCompetition(competitionId) // Correct argument for closeCompetition handler
        .accounts({
          competition: competitionPDA,
          authority: user.publicKey, // Authority of the competition (creator)
          competitionAta: competitionATA, // Competition's ATA holding USDT tokens
          masterTreasury: user.publicKey, // Master treasury authority (user in this test setup)
          masterTreasuryAta: masterTreasuryATA, // Master treasury's ATA for USDT mint
          usdtMint: usdtMint, // USDT mint address
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log("Successfully closed the competition!");
    
  });
});

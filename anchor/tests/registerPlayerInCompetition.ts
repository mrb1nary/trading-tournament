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

describe("Register Player in a competition test", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  const program = anchor.workspace
    .TradingCompetition as Program<TradingCompetition>;
  const user = (provider.wallet as anchor.Wallet).payer;

  const entryFee = new anchor.BN(100);
  const baseAmount = new anchor.BN(50);
  const winningAmount = new anchor.BN(1000);
  const category = { sixPlayers: {} };

  let competitionPDA: web3.PublicKey;
  let secondCompetitionPDA: web3.PublicKey;
  let competitionATA: web3.PublicKey;
  let secondCompetitionATA: web3.PublicKey;
  let playerProfilePDA: web3.PublicKey;
  let usdtMint: web3.PublicKey;
  let playerRegisterPDA: web3.PublicKey;

  let firstCompetitionId = 5;
  let secondCompetitionId = 6;

  before(async () => {
    try {
      // Create USDT mint
      usdtMint = await createMint(
        connection,
        user, // payer
        user.publicKey, // mint authority
        null, // freeze authority
        6 // number of decimals
      );

      // Derive the PDA for the first competition
      [competitionPDA] = await web3.PublicKey.findProgramAddressSync(
        [Buffer.from(new anchor.BN(5).toArray("le", 4))],
        program.programId
      );
      console.log("First Competition PDA:", competitionPDA.toBase58());

      // Create first competition using correct method
      await program.methods
        .createCompetition(
          firstCompetitionId, // Competition ID
          entryFee,
          baseAmount,
          winningAmount,
          new anchor.BN(Math.floor(Date.now() / 1000)), // Start time now
          new anchor.BN(Math.floor(Date.now() / 1000) + 3600), // End time one hour later
          category
        )
        .accounts({
          authority: user.publicKey,
          competition: competitionPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log(`First Competition created successfully.`);

      // Derive the PDA for the second competition
      [secondCompetitionPDA] = await web3.PublicKey.findProgramAddressSync(
        [Buffer.from(new anchor.BN(6).toArray("le", 4))],
        program.programId
      );
      console.log("Second Competition PDA:", secondCompetitionPDA.toBase58());

      // Create second competition using correct method
      await program.methods
        .createCompetition(
          secondCompetitionId, // Second Competition ID
          entryFee,
          baseAmount,
          winningAmount,
          new anchor.BN(Math.floor(Date.now() / 1000)), // Start time now
          new anchor.BN(Math.floor(Date.now() / 1000) + 3600), // End time one hour later
          category
        )
        .accounts({
          authority: user.publicKey,
          competition: secondCompetitionPDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log(`Second Competition created successfully.`);

      // Create player profile before registering in competition
      const playerName = "Test Player";
      const playerEmail = "test@example.com";
      const playerDob = "01/01/1990";

      [playerProfilePDA] = await web3.PublicKey.findProgramAddressSync(
        [Buffer.from("profile"), user.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .signupPlayer(playerName, playerEmail, playerDob)
        .accounts({
          signer: user.publicKey,
          playerProfile: playerProfilePDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log("Player Profile created!");

      // Create associated token account for the first competition
      competitionATA = await createAssociatedTokenAccount(
        connection,
        user,
        usdtMint, // Mint address
        competitionPDA,
        undefined, // Optional: ConfirmOptions
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
        true // Set allowOwnerOffCurve to true
      );
      console.log("First Competition ATA:", competitionATA.toBase58());

      // Create associated token account for the second competition
      secondCompetitionATA = await createAssociatedTokenAccount(
        connection,
        user,
        usdtMint, // Mint address
        secondCompetitionPDA,
        undefined, // Optional: ConfirmOptions
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
        true // Set allowOwnerOffCurve to true
      );
      console.log("First Competition ATA:", secondCompetitionATA.toBase58());

      // Create associated token account for user
      const userATA = await createAssociatedTokenAccount(
        connection,
        user,
        usdtMint,
        user.publicKey
      );
      console.log("User ATA:", userATA.toBase58());

      // Mint some USDT to user's ATA for testing purposes
      await mintTo(
        program.provider.connection,
        user,
        usdtMint,
        userATA,
        user.publicKey,
        1000000, // Minting 1 USDT (assuming decimals are set to 6)
        [],
        undefined,
        TOKEN_PROGRAM_ID
      );
      console.log("Minted USDT to User ATA");
    } catch (error) {
      console.error("Error in before hook:", error);
    }
  });

  it("Can register a player to a competition successfully", async () => {
    [playerRegisterPDA] = await web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("player"),
        competitionPDA.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );
    console.log("Player Registration PDA:", playerRegisterPDA.toBase58());

    await program.methods
      .registerPlayer(firstCompetitionId, new anchor.BN(50)) // Registering for Competition ID 5
      .accounts({
        competition: competitionPDA,
        player: user.publicKey,
        usdtMint: usdtMint,
        competitionAta: competitionATA,
        playerAccount: playerRegisterPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const playerAccountData = await program.account.player.fetch(
      playerRegisterPDA
    );

    assert.equal(
      playerAccountData.competitionId.toString(),
      firstCompetitionId
    );
    assert.equal(
      playerAccountData.player.toString(),
      user.publicKey.toString()
    );
    assert.equal(
      playerAccountData.baseBalance.toString(),
      baseAmount.toString()
    );

    console.log(
      `Player ${user.publicKey} registered successfully for competition number 5`
    );
  });

  it("Fails to register a player to a second competition if already participating", async () => {
    try {
      [playerRegisterPDA] = await web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("player"),
          secondCompetitionPDA.toBuffer(),
          user.publicKey.toBuffer(),
        ],
        program.programId
      );

      console.log(
        "Second Competition Player Registration PDA:",
        playerRegisterPDA.toBase58()
      );

      await program.methods
        .registerPlayer(secondCompetitionId, new anchor.BN(50))
        .accounts({
          competition: secondCompetitionPDA,
          player: user.publicKey,
          usdtMint: usdtMint,
          competitionAta: secondCompetitionATA,
          playerAccount: playerRegisterPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      assert.fail("Expected error not thrown");
    } catch (error) {
      // Check for the correct error code or message
      assert.isTrue(
        error.message.includes("Error Code: AlreadyParticipant"),
        `Unexpected error: ${error.message}`
      );
    }
  });

  /// Someday we might be able to run this test, that day is not today
//   it("Fails to register a player to competition if maximum players reached", async () => {
//     const numPlayers = 6; // Set the maximum number of players for this test
//     const playerKeypairs = [];
//     const playerProfiles = [];
//     const playerATAs = [];
//     const playerRegisterPDAs = [];

//     // Create and setup 6 players
//     for (let i = 0; i < numPlayers; i++) {
//       const playerKeypair = anchor.web3.Keypair.generate();
//       playerKeypairs.push(playerKeypair);

//       // Airdrop SOL to the player
//       await program.provider.connection.confirmTransaction(
//         await program.provider.connection.requestAirdrop(
//           playerKeypair.publicKey,
//           web3.LAMPORTS_PER_SOL
//         )
//       );

//       // Create player profile
//       const [playerProfilePDA] = await web3.PublicKey.findProgramAddressSync(
//         [Buffer.from("profile"), playerKeypair.publicKey.toBuffer()],
//         program.programId
//       );
//       playerProfiles.push(playerProfilePDA);

//       const playerName = `Test Player ${i + 1}`;
//       const playerEmail = `test${i + 1}@example.com`;
//       const playerDob = "01/01/1990";

//       await program.methods
//         .signupPlayer(playerName, playerEmail, playerDob)
//         .accounts({
//           signer: playerKeypair.publicKey,
//           playerProfile: playerProfilePDA,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .signers([playerKeypair])
//         .rpc();

//       console.log(`Player ${i + 1} Profile created!`);

//       // Create ATA for the player
//       const playerATA = await createAssociatedTokenAccount(
//         connection,
//         user, // Payer is still the original user for creating ATAs
//         usdtMint,
//         playerKeypair.publicKey
//       );
//       playerATAs.push(playerATA);

//       console.log(`Player ${i + 1} ATA:`, playerATA.toBase58());

//       // Mint some USDT to the player's ATA
//       await mintTo(
//         program.provider.connection,
//         user, // Mint authority is the original user
//         usdtMint,
//         playerATA,
//         user.publicKey,
//         1000000, // Minting 1 USDT (assuming decimals are set to 6)
//         [],
//         undefined,
//         TOKEN_PROGRAM_ID
//       );
//       console.log(`Minted USDT to Player ${i + 1} ATA`);

//       // Derive player registration PDA
//       const [playerRegisterPDA] = await web3.PublicKey.findProgramAddressSync(
//         [
//           Buffer.from("player"),
//           competitionPDA.toBuffer(),
//           playerKeypair.publicKey.toBuffer(),
//         ],
//         program.programId
//       );
//       playerRegisterPDAs.push(playerRegisterPDA);

//       // Register the player
//       await program.methods
//         .registerPlayer(firstCompetitionId, new anchor.BN(50))
//         .accounts({
//           competition: competitionPDA,
//           player: playerKeypair.publicKey,
//           usdtMint: usdtMint,
//           competitionAta: competitionATA,
//           playerAccount: playerRegisterPDA,
//           tokenProgram: TOKEN_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .signers([playerKeypair])
//         .rpc();

//       console.log(`Player ${i + 1} registered`);
//     }

//     // Create and try to register the 7th player
//     const seventhUser = anchor.web3.Keypair.generate();
//     await program.provider.connection.confirmTransaction(
//       await program.provider.connection.requestAirdrop(
//         seventhUser.publicKey,
//         web3.LAMPORTS_PER_SOL
//       )
//     );

//     const [seventhPlayerProfilePDA] =
//       await web3.PublicKey.findProgramAddressSync(
//         [Buffer.from("profile"), seventhUser.publicKey.toBuffer()],
//         program.programId
//       );

//     const seventhPlayerName = "Seventh Test Player";
//     const seventhPlayerEmail = "seventh@example.com";
//     const seventhPlayerDob = "02/02/1992";

//     await program.methods
//       .signupPlayer(seventhPlayerName, seventhPlayerEmail, seventhPlayerDob)
//       .accounts({
//         signer: seventhUser.publicKey,
//         playerProfile: seventhPlayerProfilePDA,
//         systemProgram: web3.SystemProgram.programId,
//       })
//       .signers([seventhUser])
//       .rpc();

//     // Create associated token account for user
//     const seventhUserATA = await createAssociatedTokenAccount(
//       connection,
//       user,
//       usdtMint,
//       seventhUser.publicKey
//     );
//     console.log("Seventh User ATA:", seventhUserATA.toBase58());

//     await mintTo(
//       program.provider.connection,
//       user,
//       usdtMint,
//       seventhUserATA,
//       user.publicKey,
//       1000000, // Minting 1 USDT (assuming decimals are set to 6)
//       [],
//       undefined,
//       TOKEN_PROGRAM_ID
//     );

//     let [seventhPlayerRegisterPDA] =
//       await web3.PublicKey.findProgramAddressSync(
//         [
//           Buffer.from("player"),
//           competitionPDA.toBuffer(),
//           seventhUser.publicKey.toBuffer(),
//         ],
//         program.programId
//       );

//     try {
//       // Attempt to register the 7th player (should fail)
//       await program.methods
//         .registerPlayer(firstCompetitionId, new anchor.BN(50))
//         .accounts({
//           competition: competitionPDA,
//           player: seventhUser.publicKey,
//           usdtMint: usdtMint,
//           competitionAta: competitionATA,
//           playerAccount: seventhPlayerRegisterPDA,
//           tokenProgram: TOKEN_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .signers([seventhUser])
//         .rpc();

//       assert.fail("Expected error not thrown");
//     } catch (error) {
//       console.log("Caught error:", error);

//       // Pass the test if any error is thrown
//       assert.ok(true, "An error was thrown, as expected.");
//     }



//   });
});

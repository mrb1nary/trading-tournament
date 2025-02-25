import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { TradingCompetition } from "../target/types/trading_competition";
import * as web3 from "@solana/web3.js";

describe("Signup Player Test", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .TradingCompetition as Program<TradingCompetition>;
  const user = (program.provider as anchor.AnchorProvider).wallet.payer;

  it("Can signup a player successfully", async () => {
    const playerName = "Test Player";
    const playerEmail = "test@example.com";
    const playerDob = "01/01/1990";

    // Derive the PDA for the player profile
    const [playerProfilePDA] = await web3.PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), user.publicKey.toBuffer()],
      program.programId
    );

    // Call the signup_player instruction
    await program.methods
      .signupPlayer(playerName, playerEmail, playerDob)
      .accounts({
        signer: user.publicKey,
        playerProfile: playerProfilePDA,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Fetch the created player profile account
    const playerProfileAccount = await program.account.playerProfile.fetch(
      playerProfilePDA
    );

    // Verify the account data
    assert.equal(playerProfileAccount.playerName, playerName);
    assert.equal(playerProfileAccount.playerEmail, playerEmail);
    assert.equal(playerProfileAccount.playerDob, playerDob);
    assert.equal(
      playerProfileAccount.playerWalletAddress.toBase58(),
      user.publicKey.toBase58()
    );
    assert.isFalse(playerProfileAccount.participatingInOtherCompetition);

    console.log(`Player signed up successfully: ${user.publicKey.toBase58()}`);
  });

  it("Fails to signup a player with a too long player_name", async () => {
    const playerName = "This name is too longggggggggggggg";
    const playerEmail = "test@example.com";
    const playerDob = "01/01/1990";

    // Derive the PDA for the player profile
    const [playerProfilePDA] = await web3.PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), user.publicKey.toBuffer()],
      program.programId
    );
    try {
      // Call the signup_player instruction
      await program.methods
        .signupPlayer(playerName, playerEmail, playerDob)
        .accounts({
          signer: user.publicKey,
          playerProfile: playerProfilePDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      assert.fail("Expected error not thrown");
    } catch (error) {
      assert.isTrue(
        error.message.includes(
          "Player name is too long. Maximum length is 20 characters."
        ),
        `Unexpected error: ${error.message}`
      );
    }
  });

  it("Fails to signup a player with a too long player_email", async () => {
    const playerName = "Test Player";
    const playerEmail =
      "ThisEmailIsTooLonggggggggggggggggggggggggg@example.com";
    const playerDob = "01/01/1990";

    // Derive the PDA for the player profile
    const [playerProfilePDA] = await web3.PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), user.publicKey.toBuffer()],
      program.programId
    );
    try {
      // Call the signup_player instruction
      await program.methods
        .signupPlayer(playerName, playerEmail, playerDob)
        .accounts({
          signer: user.publicKey,
          playerProfile: playerProfilePDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      assert.fail("Expected error not thrown");
    } catch (error) {
      assert.isTrue(
        error.message.includes(
          "Player email is too long. Maximum length is 50 characters."
        ),
        `Unexpected error: ${error.message}`
      );
    }
  });

  it("Fails to signup a player with a too long player_dob", async () => {
    const playerName = "Test Player";
    const playerEmail = "test@example.com";
    const playerDob = "11/11/111111111111";

    // Derive the PDA for the player profile
    const [playerProfilePDA] = await web3.PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), user.publicKey.toBuffer()],
      program.programId
    );
    try {
      // Call the signup_player instruction
      await program.methods
        .signupPlayer(playerName, playerEmail, playerDob)
        .accounts({
          signer: user.publicKey,
          playerProfile: playerProfilePDA,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      assert.fail("Expected error not thrown");
    } catch (error) {
      assert.isTrue(
        error.message.includes(
          "Player date of birth is too long. Maximum length is 10 characters."
        ),
        `Unexpected error: ${error.message}`
      );
    }
  });
});

'use client';

import styles from './page.module.css';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const presaleConfig = {
  presaleWallet: 'CLAdX4NBgS5YCPFnTbyfX6uUUCVSx5JCTauS4mLXpgT', // Presale wallet address
  tokenPriceInSol: 0.01, // Price of 1 token in SOL
};

export default function Presale() {
  const [amountToBuy, setAmountToBuy] = useState<number>(0);
  const wallet = useWallet();
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed'); // Use devnet or mainnet as appropriate

  // Success toast notification
  const notifySuccess = (txUrl: string) => {
    toast.success(
      <div>
        🎉 Transaction Successful!<br />
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#f0f0f0', textDecoration: 'underline' }}
        >
          View on Solscan
        </a>
      </div>
    );
  };

  // Error toast notification
  const notifyError = (message: string) => {
    toast.error(`🚨 Transaction Failed: ${message}`);
  };

  // Function to handle SOL transfer during presale
  const handleBuyTokens = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      notifyError('Wallet not connected!');
      return;
    }

    if (amountToBuy <= 0) {
      notifyError('Please enter a valid token amount.');
      return;
    }

    try {
      // Calculate total SOL to send
      const solAmount = amountToBuy * presaleConfig.tokenPriceInSol;
      const lamports = solAmount * 1e9; // Convert SOL to lamports

      // Fetch the recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      console.log('Recent Blockhash:', blockhash);

      // Create a transaction to send SOL to presale wallet
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: wallet.publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(presaleConfig.presaleWallet),
          lamports,
        })
      );

      // Check if signTransaction is available
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }

      // Sign the transaction with the wallet
      const signedTransaction = await wallet.signTransaction(transaction);
      console.log('Signed Transaction:', signedTransaction);

      // Send the signed transaction to the network
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      console.log('Transaction Signature:', signature);

      // Confirm the transaction on-chain
      await connection.confirmTransaction(signature, 'confirmed');

      // Notify success with Solscan link
      notifySuccess(`https://solscan.io/tx/${signature}?cluster=devnet`);
    } catch (error: any) {
      console.error('Error during transaction:', error);
      notifyError(error.message || 'Something went wrong!');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Presale</h1>
      <p className={styles.subtitle}>
        Buy our token for {presaleConfig.tokenPriceInSol} SOL each.
      </p>

      <input
        type="number"
        placeholder="Enter amount to buy"
        value={amountToBuy}
        onChange={(e) => setAmountToBuy(Number(e.target.value))}
        className={styles.inputField}
      />

      <button onClick={handleBuyTokens} className={styles.button}>
        Buy Tokens
      </button>

      {/* Toast Container for Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}
import { Transaction, SystemProgram, PublicKey, Connection, ComputeBudgetProgram } from '@solana/web3.js';
import { Buffer } from 'buffer';
window.Buffer = Buffer; // Make Buffer globally available

const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=0287c719-680c-47a3-9381-e289350a3e95', 'confirmed');
let provider;
let lastRequestTime = 0;
const requestDelay = 2000;  // 2 seconds delay between requests

async function updateBalances() {
    const passWallet = 'C3wxTA8YjYW83vWUL4AYddrotTX2XZFePm8QUcbFmZgx';  // Pass wallet address
    const failWallet = '2z2dXzaGHn7WCaXq1UNjwXNoBoUgp3BFR3mQSZbbJ67W';  // Fail wallet address

    try {
        console.log("Fetching balances...");

        // Fetch balances for both wallets
        const passBalance = await connection.getBalance(new PublicKey(passWallet));
        const failBalance = await connection.getBalance(new PublicKey(failWallet));

        console.log("Pass Wallet Balance (lamports):", passBalance);
        console.log("Fail Wallet Balance (lamports):", failBalance);

        // Convert lamports to SOL as numbers
        const passBalanceSol = passBalance / 1e9;
        const failBalanceSol = failBalance / 1e9;
        const netBalanceSol = passBalanceSol - failBalanceSol;

        console.log("Pass Wallet Balance (SOL):", passBalanceSol);
        console.log("Fail Wallet Balance (SOL):", failBalanceSol);
        console.log("Net Balance (SOL):", netBalanceSol);

        // Update the display with the wallet balances
        document.getElementById('pass-balance').innerText = passBalanceSol.toFixed(4) + ' SOL';
        document.getElementById('fail-balance').innerText = failBalanceSol.toFixed(4) + ' SOL';
        document.getElementById('net-balance').innerText = netBalanceSol.toFixed(4) + ' SOL';

        // Update the Active Vault
        const activeVaultElement = document.getElementById('active-vault');
        if (passBalanceSol >= failBalanceSol) {
            activeVaultElement.innerText = 'PASS';
            activeVaultElement.className = 'active-vault-pass';
        } else {
            activeVaultElement.innerText = 'FAIL';
            activeVaultElement.className = 'active-vault-fail';
        }

    } catch (error) {
        console.error('Error fetching wallet balances:', error);
        document.getElementById('pass-balance').innerText = 'Error loading balance';
        document.getElementById('fail-balance').innerText = 'Error loading balance';
        document.getElementById('net-balance').innerText = 'Error loading balance';
        document.getElementById('active-vault').innerText = 'Error';
    }
}

document.getElementById('connect-wallet').addEventListener('click', async () => {
    provider = window.solana;
    if (provider) {
        try {
            await provider.connect();
            console.log('Connected to wallet:', provider.publicKey.toString());
            
            // Change the button text to "Connected"
            const connectButton = document.getElementById('connect-wallet');
            connectButton.textContent = 'Connected';
            connectButton.disabled = true; // Optionally, disable the button to prevent further clicks

            document.getElementById('deposit-pass').disabled = false;
            document.getElementById('deposit-fail').disabled = false;

            // Update wallet balances after connecting
            await updateBalances();
        } catch (err) {
            console.error('Failed to connect wallet:', err);
        }
    } else {
        alert('Please install a Solana wallet extension');
    }
});

async function handleTransactionWithRetry(recipientAddress, lamports, retries = 3) {
    const currentTime = Date.now();
    if (currentTime - lastRequestTime < requestDelay) {
        console.log('Delaying request to avoid rate limiting...');
        return;
    }

    lastRequestTime = currentTime;

    try {
        const response = await connection.getLatestBlockhash();
        console.log("Full response from getLatestBlockhash:", JSON.stringify(response, null, 2));

        const blockhash = response.blockhash;
        console.log("Extracted Blockhash:", blockhash);

        if (blockhash) {
            const transaction = new Transaction();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = provider.publicKey;

            transaction.add(
                ComputeBudgetProgram.setComputeUnitPrice({
                    microLamports: 1_000_000, 
                }),
                SystemProgram.transfer({
                    fromPubkey: provider.publicKey,
                    toPubkey: new PublicKey(recipientAddress), 
                    lamports,
                })
            );

            const signedTransaction = await provider.signTransaction(transaction);

            const txid = await connection.sendRawTransaction(signedTransaction.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            });

            console.log('Transaction sent with ID:', txid);

            const status = await connection.confirmTransaction(txid, 'confirmed');
            console.log('Transaction confirmation status:', status);

            if (status.value.err) {
                console.error('Transaction failed:', status.value.err);
            } else {
                console.log('Transaction confirmed:', txid);
                // Update the balances after the transaction
                await updateBalances();
            }
        } else {
            throw new Error("Failed to get blockhash: blockhash is undefined or not found in response");
        }
    } catch (err) {
        if (retries > 0 && err.message.includes('429')) {
            console.error('Rate limit hit, retrying...', err);
            await new Promise(resolve => setTimeout(resolve, 2 ** (3 - retries) * 1000));
            return handleTransactionWithRetry(recipientAddress, lamports, retries - 1);
        } else {
            console.error('Failed to sign transaction after retries or due to a non-429 error:', err);
        }
    }
}

document.getElementById('deposit-pass').addEventListener('click', async () => {
    const amountInput = document.getElementById('pass-amount');
    const amountSol = parseFloat(amountInput.value);
    
    if (isNaN(amountSol) || amountSol <= 0) {
        alert("Please enter a valid amount of SOL to deposit.");
        return;
    }

    const lamports = amountSol * 1e9; // Convert SOL to lamports
    const recipientAddress = 'C3wxTA8YjYW83vWUL4AYddrotTX2XZFePm8QUcbFmZgx';
    await handleTransactionWithRetry(recipientAddress, lamports);
});

document.getElementById('deposit-fail').addEventListener('click', async () => {
    const amountInput = document.getElementById('fail-amount');
    const amountSol = parseFloat(amountInput.value);
    
    if (isNaN(amountSol) || amountSol <= 0) {
        alert("Please enter a valid amount of SOL to deposit.");
        return;
    }

    const lamports = amountSol * 1e9; // Convert SOL to lamports
    const recipientAddress = '2z2dXzaGHn7WCaXq1UNjwXNoBoUgp3BFR3mQSZbbJ67W';  // Corrected string
    await handleTransactionWithRetry(recipientAddress, lamports);
});

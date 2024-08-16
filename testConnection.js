const { Connection, clusterApiUrl, Transaction } = require('@solana/web3.js');

const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

// Function to confirm connection
async function confirmConnection() {
    try {
        const version = await connection.getVersion();
        console.log('Connection to Solana network successful:', version);
    } catch (error) {
        console.error('Failed to connect to the Solana network:', error);
    }
}

// Event listener for wallet connection
document.getElementById('connect-wallet').addEventListener('click', async () => {
    const provider = window.solana;
    if (provider) {
        try {
            await provider.connect();
            console.log('Connected to wallet:', provider.publicKey.toString());
            document.getElementById('sign-transaction').disabled = false;
        } catch (err) {
            console.error('Failed to connect wallet:', err);
        }
    } else {
        alert('Please install a Solana wallet extension');
    }
});

// Event listener for transaction signing
document.getElementById('sign-transaction').addEventListener('click', async () => {
    const transaction = new Transaction().add(
        // Add your transaction instructions here
    );

    try {
        const signed = await provider.signTransaction(transaction);
        console.log('Transaction signed:', signed);
    } catch (err) {
        console.error('Failed to sign transaction:', err);
    }
});

// Confirm connection on page load
confirmConnection();

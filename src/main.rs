use solana_client::rpc_client::RpcClient;
use solana_client::rpc_request::TokenAccountsFilter;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::commitment_config::CommitmentConfig;
use solana_account_decoder::{UiAccountData, UiAccountData::Json};
use std::str::FromStr;

#[tokio::main]
async fn main() {
    let rpc_url = "https://api.mainnet-beta.solana.com";
    let client = RpcClient::new_with_commitment(rpc_url, CommitmentConfig::confirmed());

    let wallet_address = Pubkey::from_str("2iLkGuCg4ApvPedVEEcS5bVf6NcbzxyNkZJpybiD68MF").unwrap();
    let token_a_mint = Pubkey::from_str("92Y1n9iYQppj7oJG7BWRyTLDscMn7AipFLFFXh25GZfi").unwrap();
    let token_b_mint = Pubkey::from_str("3kUFQp2SJw7qMoEpMyqu6wuj3X4pg2YaDtwweXDdqSnJ").unwrap();

    // Function to fetch token account balances
    async fn fetch_token_balance(client: &RpcClient, wallet_address: &Pubkey, token_mint: &Pubkey) -> Option<u64> {
        let token_accounts = client
            .get_token_accounts_by_owner(
                wallet_address,
                TokenAccountsFilter::Mint(*token_mint),
            )
            .expect("Failed to fetch token accounts");

        let token_account = token_accounts
            .iter()
            .find(|account| match &account.account.data {
                Json(parsed) => parsed.program.len() == 165, // Adjust based on the actual JSON structure
                _ => false,
            })?;

        let token_balance = client.get_token_account_balance(&Pubkey::from_str(&token_account.pubkey).unwrap()).ok()?;
        token_balance.amount.parse::<u64>().ok()
    }

    // Fetch token A balance
    let token_a_balance = fetch_token_balance(&client, &wallet_address, &token_a_mint).await.unwrap_or(0);
    // Fetch token B balance
    let token_b_balance = fetch_token_balance(&client, &wallet_address, &token_b_mint).await.unwrap_or(0);

    println!("Token A balance: {}", token_a_balance);
    println!("Token B balance: {}", token_b_balance);
}

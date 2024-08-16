use solana_client::rpc_client::RpcClient;
use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;
use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

#[tokio::main]
async fn main() {
    let rpc_url = "https://api.mainnet-beta.solana.com"; // Replace with appropriate network URL
    let client = RpcClient::new(rpc_url);

    let amm_address = Pubkey::from_str("2iLkGuCg4ApvPedVEEcS5bVf6NcbzxyNkZJpybiD68MF").unwrap();
    let token_a_address = Pubkey::from_str("92Y1n9iYQppj7oJG7BWRyTLDscMn7AipFLFFXh25GZfi").unwrap();
    let token_b_address = Pubkey::from_str("3kUFQp2SJw7qMoEpMyqu6wuj3X4pg2YaDtwweXDdqSnJ").unwrap();

    let token_a_balance = get_token_balance(&client, &token_a_address).expect("Failed to get token A balance");
    let token_b_balance = get_token_balance(&client, &token_b_address).expect("Failed to get token B balance");

    // Token B is worth 1 dollar
    let token_b_price = 1.0;

    // Calculate the price of Token A in terms of Token B
    let token_a_price = token_b_balance as f64 / token_a_balance as f64 * token_b_price;

    println!("Token A price: ${}", token_a_price);
}

fn get_token_balance(client: &RpcClient, token_account_address: &Pubkey) -> Result<u64, Box<dyn std::error::Error>> {
    let account_data = client.get_account_data(token_account_address)?;
    let token_account: TokenAccount = try_from_slice_unchecked(&account_data)?;
    Ok(token_account.amount)
}


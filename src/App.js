import { ethers } from 'ethers';
import { useState } from 'react';

import './App.css';

const connectToMetamask = async ({ setAccount, setError }) => {
  try {
    if (!window.ethereum) {
      throw new Error('No crypto wallet found. Please install it.');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // MetaMask requires requesting permission to connect users accounts
    await provider.send("eth_requestAccounts", []);

    // The MetaMask plugin also allows signing transactions to
    // send ether and pay to change state within the blockchain.
    // For this, you need the account signer...
    const signer = provider.getSigner();

    const account = await signer.getAddress();

    console.log('Account connected:', account);

    setAccount(account);
    setError();
  } catch (err) {
    setError(err.message);
  }
};

const sendTransaction = async ({ account, setTxHash, setError }) => {
  if (!window.ethereum) {
    throw new Error('No crypto wallet found. Please install it.');
  }

  // approve
  const payload = (await fetch(`http://localhost:3000/contract-call/pay/build`, {
    method: 'POST',
    body: JSON.stringify({
      "tokenTicker": "B2BT",
      "tokenAmount": 10,
      "userAddress": account,
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'secretKey123',
    },
  }));

  const { approve, transfer } = await payload.json();

  const { data, to, value } = approve || transfer;

  console.log({ data, to, value });

  window.ethereum
    .request({
      method: 'eth_sendTransaction',
      // The following sends an EIP-1559 transaction. Legacy transactions are also supported.
      params: [
        {
          from: account, // The user's active address.
          to,
          value,
          data,
        },
      ],
    })
    .then((txHash) => setTxHash(txHash))
    .catch((error) => setError(error.message));
};

function App() {
  const [account, setAccount] = useState();
  const [txHash, setTxHash] = useState();
  const [error, setError] = useState();

  const handleConnect = () => connectToMetamask({
    setAccount,
    setError,
  });

  const handleSendTransaction = () => sendTransaction({
    account,
    setTxHash,
    setError,
  })

  return (
    <div className="App">
      <h1>Metamask Proto</h1>
      <div>
        <h2>Account: <span className="account">{account}</span></h2>
        <button className="enableEthereumButton" onClick={handleConnect}>Enable Ethereum</button>
      </div>

      <div>
        <h2>Account: <span className="transactionHash">{txHash}</span></h2>
        <button className="sendTransactionButton" onClick={handleSendTransaction}>Send</button>
      </div>

      <div>
        <h2>Error: <span className="error">{error}</span></h2>
      </div>
    </div>
  );
}

export default App;

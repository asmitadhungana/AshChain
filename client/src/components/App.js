import React, { Component } from "react";
import { response } from "express";
import { json } from "body-parser";

class App extends Component {
  state = { walletInfo: { address: "kakjasdg", balance: 1000 } };

  // componentDidMount() {
  //   fetch("http://localhost:3000/api/wallet-info")
  //     .then((response) => response.json())
  //     .then((json) => this.setState({ walletInfo: json }));
  // }

  render() {
    const { address, balance } = this.state.walletInfo;
    return (
      <div>
        <div> Welcome to the blockchain</div>
        <div>Address: {address}</div>
        <div>Balance: {balance}</div>
      </div>
    );
  }
}

export default App;

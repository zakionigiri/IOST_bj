import React from "react";

import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"
import IOST from "iost";

const address = "ContractCqm2Mc6Tct3T4CcQPUZtrHPaUoZDEAqsZfVDvBUXRM1L";

const iost = new IOST.IOST();
const rpc = new IOST.RPC(new IOST.HTTPProvider("http://13.52.105.102:30001"));
const iwallet = window.IWalletJS;


class IndexPage extends React.Component {
  constructor(props){
    super(props);
    iost.setRPC(rpc);
    this.state = {
      isLoadFailed: false,
      isRegistered: false,
      isLoading: true,
      aite: '',
      num: 0
    }
    this.iost = iost;
    this.iwallet = iwallet;
    this.becomeDuelist = this.becomeDuelist.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.duel = this.duel.bind(this);
    this.tatakau = this.tatakau.bind(this);
  }

  async componentDidMount(){
    if( !this.iwallet) window.location.reload();
    const account = await this.iwallet.enable();
    if(account) {
      this.iost = this.iwallet.newIOST(IOST);
      this.iost.setAccount(account);
    }
    const d = await rpc.blockchain.getContractStorage(address, 'duelist', this.iwallet.account.name, true);
    const duelist = JSON.parse(d.data);
    if( !duelist ){
      this.setState({
        isRegistered: false
      })
    }
    this.setState({
      isLoadFailed: false,
      isLoading: false,
      duelist: duelist
    })
  }

  async becomeDuelist(){
    const tx =  await this.iost.callABI(
      address,
      'deckWoKau',
      []
    );
    tx.setChainID(1023);
    this.iost.signAndSend(tx)
      .on("pending", console.log("pending"))
      .on("success", (res)=> console.log(res))
      .on("failed", (err) => console.log(err));
  }

  async duel(){
    const {aite} = this.state;
    const tx = await this.iost.callABI(
      address,
      'duelWoIdomu',
      [
        aite
      ]
    )
    tx.setChainID(1023);
    this.iost.signAndSend(tx)
      .on("pending", console.log("pending"))
      .on("success", (res)=> {
          const d = JSON.parse(res.returns[0]);
          const duelId = JSON.parse(d)[2];
          alert(`デュエルIDは${duelId}です`);
        }
      )
      .on("failed", (err) => console.log(err));
  }

  async tatakau(){
    const { duelist, num, duelId } = this.state;
    const tx = this.iost.callABI(
      address,
      "tatakau",
      [
        duelist.genzaiNoAite,
        "deck1",
        num, 
        duelId
      ]
    );
    tx.setChainID(1023);
    this.iost.signAndSend(tx)
      .on("pending", console.log("pending"))
      .on("success", (res)=> window.location.reload())
      .on("failed", (err) => console.log(err));
  } 

  handleChange(e){
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  render(){
    const {duelist } = this.state;
    if( this.state.isLoading ){
      return (
        <div>
          <button onClick={this.becomeDuelist}>
            デュエリストになる
          </button>
        </div>
      )
    }

    if(this.state.isLoadFailed){
      return (
        <div>
          iWalletにログインしてください
        </div>
      )
    }
    return(
      <Layout>
        <SEO title="Home" />
        <div>
          <li>
            デュエリスト : {this.iwallet.account.name}
          </li>
          <li>
            HP : {duelist.HP}
          </li>
          <li>
            勝ち: {duelist.duelHistory.win}
          </li>
          <li>
            負け: {duelist.duelHistory.lose}
          </li>
          <li>
            引き分け: {duelist.duelHistory.draw}
          </li>
          <li>
            デッキ：{duelist.deck.deck1}
          </li>
          {duelist.genzaiNoAite !== this.iwallet.account.name && 
          <li>
            現在の相手：{duelist.genzaiNoAite}
          </li>}
          <div>
            <input name="aite" onChange={this.handleChange}></input>
            <button onClick={this.duel}>デュエルを申し込む</button>
          </div>
          { duelist.genzaiNoAite !== this.iwallet.account.name && 
            <div>
              <input type="number" name="num" onChange={this.handleChange} placeholder="何枚目"></input>
              <input name="duelId" onChange={this.handleChange} placeholder="デュエルID"></input>

              <button onClick={this.tatakau}>たたかう</button>
            </div>
          }
          
        </div>
      </Layout>
    )
  }
}

export default IndexPage

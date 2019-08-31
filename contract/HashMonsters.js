class HashMonsters{
    init(){
    }

    can_update(data) {
        return blockchain.requireAuth(blockchain.contractOwner(), "active");
      }

    deckWoKau(){
        const publisher = blockchain.publisher();
        if(storage.mapHas('duelist', publisher)) throw new Error("アカウントは登録済みです");
        this.duelistNiNaru(publisher);
    }

    duelistNiNaru(duelistName){
        const hash = IOSTCrypto.sha3(duelistName);
        const duelistInfo = {
            HP: 20,
            duelHistory: {
                win: 0,
                lose: 0,
                draw: 0
            },
            genzaiNoAite: blockchain.publisher(),
            deck: {
                deck1: hash
            }}
        this._mapPut('duelist', duelistName, duelistInfo);
        return duelistInfo;
    }

    duelGaHajimaru(duelist1, duelist2, nonce){
        const duelId = IOSTCrypto.sha3( duelist1 + duelist2 +  nonce);
        const duelInfo = {
            senko: duelist1,
            kouko: duelist2,
            next: duelist1
        }
        this._mapPut('duel', duelId, duelInfo);
        return duelId;
    }

    duelWoIdomu(aite){
        if(!storage.mapHas('duelist', aite)){
            const aiteNoInfo = this.duelistNiNaru(aite);
            const jibunNoInfo= this._mapGet('duelist', blockchain.publisher());
            jibunNoInfo.genzaiNoAite = aite;

            this._mapPut('duelist', blockchain.publisher(), jibunNoInfo);
            const duelID = this.duelGaHajimaru(blockchain.publisher(), aite, jibunNoInfo.duelHistory.win);

            return [aiteNoInfo, jibunNoInfo, duelID]
        } else {
            const aiteNoInfo = this._mapGet('duelist', aite);
            const jibunNoInfo = this._mapGet('duelist', blockchain.publisher());

            aiteNoInfo.genzaiNoAite = blockchain.publisher();
            jibunNoInfo.genzaiNoAite = aite;
            const duelID =  this.duelGaHajimaru(blockchain.publisher(), aite, jibunNoInfo.duelHistory.win);

            this._mapPut('duelist', aite, aiteNoInfo);
            this._mapPut('duelist', blockchain.publisher(), jibunNoInfo);
            return [aiteNoInfo, jibunNoInfo, duelID];
        }
    }

    tatakau(aite, deck, v1, duelId){
        const publisher = blockchain.publisher()
        const duelInfo = this._mapGet('duel', duelId);

        if( !duelInfo) throw new Error('デュエルがありません');
        if ( v1 > 3 ||v1 < 0 ) throw new Error("不正な数字です");

        const jibunNoInfo = this._mapGet('duelist', publisher);
        if(jibunNoInfo.genzaiNoAite !== aite) throw new Error('対戦相手が違います');
        let jibunNoDeck = jibunNoInfo.deck[deck];
        if(!jibunNoDeck) throw new Error('指定したデッキがありません');

        const aiteNoInfo = this._mapGet('duelist', aite);
        const aiteNoDeck = aiteNoInfo.deck.deck1;

        const jibunNoCard = this._splitHash(jibunNoDeck, v1);
        const aiteNoCard = this._splitHash(aiteNoDeck, v1);

        const jibunNoCard2 = this._splitHash(jibunNoDeck, 4);
        const aiteNoCard2 = this._splitHash(aiteNoDeck, 4);

        const damage1 = this._battle(jibunNoCard, aiteNoCard);
        const damage2 = this._battle(jibunNoCard2, aiteNoCard2);

        const jibunNoHP = jibunNoInfo.HP - damage1[0] - damage2[0]; 
        const aiteNoHP = aiteNoInfo.HP - damage1[1] - damage2[1];

        if ( jibunNoHP > 0 && aiteNoHP > 0){
            jibunNoInfo.HP = jibunNoHP;
            aiteNoInfo.HP = aiteNoHP;
            if( duelInfo.next === publisher){
                duelInfo.next = aite ;
            } else {
                duelInfo.next = publisher;
            }
            this._mapPut('duel', duelId, duelInfo)
        } else if ( jibunNoHP > 0 && aiteNoHP < 0 ){
            jibunNoInfo.HP = 20;
            jibunNoInfo.duelHistory.win = jibunNoInfo.duelHistory.win + 1;
            jibunNoInfo.deck[aite] = aiteNoDeck;
            jibunNoInfo.genzaiNoAite = publisher;

            aiteNoInfo.genzaiNoAite = aite;
            aiteNoInfo.HP = 20;
            aiteNoInfo.duelHistory.lose = aiteNoInfo.duelHistory.lose + 1;
            storage.mapDel('duel', duelId);
        } else if (jibunNoHP < 0 && aiteNoHP > 0 ){
            jibunNoInfo.HP = 20;
            jibunNoInfo.duelHistory.lose = jibunNoInfo.duelHistory.lose + 1;
            jibunNoInfo.genzaiNoAite = publisher;

            aiteNoInfo.genzaiNoAite = aite;
            aiteNoInfo.HP = 20;
            aiteNoInfo.duelHistory.win= aiteNoInfo.duelHistory.win+ 1;
            aiteNoInfo.deck[publisher] = jibunNoDeck;
            storage.mapDel('duel', duelId);

        } else {
            jibunNoInfo.HP = 20;
            jibunNoInfo.duelHistory.draw = jibunNoInfo.duelHistory.draw + 1;
            jibunNoInfo.genzaiNoAite = publisher;

            aiteNoInfo.genzaiNoAite = aite;
            aiteNoInfo.HP = 20;
            aiteNoInfo.duelHistory.draw= aiteNoInfo.duelHistory.draw+ 1;
            storage.mapDel('duel', duelId);

        }

        this._mapPut('duelist', publisher, jibunNoInfo);
        this._mapPut('duelist', aite, aiteNoInfo);
    }

    deleteDuelist(duelistName){
        storage.mapDel('duelist', duelistName);
    }

    getDuel(duelId){
        return this._mapGet('duel', duelId);
    }

    getDuelist(duelistName){
        return this._mapGet('duelist', duelistName);
    }

    _battle(j, a){
        const jibunNoTehuda = j.split('');
        const aiteNoTehuda = a.split('');
        let jibunNoDamage = 0;
        let aiteNoDamage = 0;

        for(let i = 0; i < jibunNoTehuda.length; i++){
            if(jibunNoTehuda[i] < aiteNoTehuda[i]){
                jibunNoDamage = jibunNoDamage + 1;
            }else {
                aiteNoDamage = aiteNoDamage + 1;
            }
        }
        return [jibunNoDamage, aiteNoDamage];
    }

    _splitHash(hash, n){
        if( n === 4){
            return hash.slice(41);
        }
        return hash.slice( n * 10, n * 10 + 10);
    }

    _put(k,v){
        const value = JSON.stringify(v);
        storage.put(k, value);
    }

    _get(k){
        const v = storage.get(k);
        return JSON.parse(v);
    }

    _mapGet(k, f){
     const v = storage.mapGet(k, f);
     const value = JSON.parse(v);
     return value;   
    }

    _mapPut(k, f, v){
        const value = JSON.stringify(v);
        storage.mapPut(k, f, value);
    }
}



module.exports = HashMonsters;
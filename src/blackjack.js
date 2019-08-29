class BlackJack{
    init(){
    }

    createGame(masterPhrase, gameId){
        if( storage.mapHas('games', gameId) )throw new Error("This game ID is already used");
        const game = new Game(masterPhrase, gameId, blockchain.publisher());
        this._mapPut('games', gameId, game);
    }

    joinGame(phrase, gameId){
        if(!storage.mapHas('games', gameId)) throw new Error("Game does not exits");
        const player = new Player(blockchain.publisher());
        const game = this._mapGet('games', gameId);
        this._mapPut('player', gameId, player);
        game.masterPhrase = phrase;

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


class Game {
    constructor(masterPhrase, gameId, gameOwner){
        this.masterPhrase = masterPhrase;
        this.gameId = gameId;
        this.gameOwner = gameOwner;
        const players = {};
    }
}

class Player {
    constructor(playerName, point){
        this.playerName = playerName;
        this.point = point;
    }
}



module.exports = BlackJack;
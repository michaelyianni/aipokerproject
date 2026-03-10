class MockGameData {

  static Map<String, dynamic> getRiverScenario() {
    return {
      "communityCards": ["2d", "6s", "6c", "2s", "7c"],
      "players": {
        "id49": {
          "id": "id49",
          "name": "Alice",
          "hand": ["Ah", "Kh"],
          "chips": 0,
          "currentBet": 890,
          "totalBetThisHand": 1000,
          "hasFolded": false,
          "isAllIn": true,
          "hasLeft": false,
        },
        "id50": {
          "id": "id50",
          "name": "Bob",
          "hand": ["Jc", "Tc"],
          "chips": 500,
          "currentBet": 0,
          "totalBetThisHand": 110,
          "hasFolded": true,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id51": {
          "id": "id51",
          "name": "Charlie",
          "hand": ["Qd", "Js"],
          "chips": 1200,
          "currentBet": 890,
          "totalBetThisHand": 1000,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id52": {
          "id": "id52",
          "name": "You",
          "hand": ["As", "Ad"],
          "chips": 800,
          "currentBet": 100,
          "totalBetThisHand": 100,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
      },
      "playerOrder": ["id49", "id50", "id51", "id52"],
      "currentTurnPlayerId": "id52",
      "activePlayerIds": ["id49", "id52"],
      "pots": [
        {
          "amount": 335,
          "eligiblePlayerIds": ["id49", "id52"],
        },
      ],
      "currentBet": 890,
      "currentStreet": "river",
      "smallBlindId": "id50",
      "bigBlindId": "id51",
      "dealerId": "id49",
      "handResults": null,
    };
  }

  static Map<String, dynamic> getPreflopScenario() {
    return {
      "communityCards": [],
      "players": {
        "id49": {
          "id": "id49",
          "name": "Alice",
          "hand": ["9h", "9d"],
          "chips": 950,
          "currentBet": 50,
          "totalBetThisHand": 50,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id50": {
          "id": "id50",
          "name": "Bob",
          "hand": ["Kc", "Qc"],
          "chips": 900,
          "currentBet": 100,
          "totalBetThisHand": 100,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id51": {
          "id": "id51",
          "name": "You",
          "hand": ["Ah", "Kh"],
          "chips": 1000,
          "currentBet": 0,
          "totalBetThisHand": 0,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
      },
      "playerOrder": ["id49", "id50", "id51"],
      "currentTurnPlayerId": "id51",
      "activePlayerIds": ["id49", "id50", "id51"],
      "pots": [
        {
          "amount": 150,
          "eligiblePlayerIds": ["id49", "id50", "id51"],
        },
      ],
      "currentBet": 100,
      "currentStreet": "pre-flop",
      "smallBlindId": "id49",
      "bigBlindId": "id50",
      "dealerId": "id51",
      "handResults": null,
    };
  }

  static Map<String, dynamic> getFlopScenario() {
    return {
      "communityCards": ["Ah", "Kd", "Qs"],
      "players": {
        "id49": {
          "id": "id49",
          "name": "Alice",
          "hand": ["Jh", "Th"],
          "chips": 850,
          "currentBet": 150,
          "totalBetThisHand": 200,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id50": {
          "id": "id50",
          "name": "Bob",
          "hand": ["Ac", "Kc"],
          "chips": 750,
          "currentBet": 150,
          "totalBetThisHand": 250,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id51": {
          "id": "id51",
          "name": "Charlie",
          "hand": ["7h", "6h"],
          "chips": 650,
          "currentBet": 0,
          "totalBetThisHand": 100,
          "hasFolded": true,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id52": {
          "id": "id52",
          "name": "You",
          "hand": ["As", "Qh"],
          "chips": 900,
          "currentBet": 150,
          "totalBetThisHand": 150,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
      },
      "playerOrder": ["id49", "id50", "id51", "id52"],
      "currentTurnPlayerId": "id49",
      "activePlayerIds": ["id49", "id50", "id52"],
      "pots": [
        {
          "amount": 700,
          "eligiblePlayerIds": ["id49", "id50", "id51", "id52"],
        },
      ],
      "currentBet": 150,
      "currentStreet": "flop",
      "smallBlindId": "id50",
      "bigBlindId": "id51",
      "dealerId": "id49",
      "handResults": null,
    };
  }

  static Map<String, dynamic> getTurnScenario() {
    return {
      "communityCards": ["Tc", "9h", "8s", "7d"],
      "players": {
        "id49": {
          "id": "id49",
          "name": "Alice",
          "hand": ["Jh", "6d"],
          "chips": 400,
          "currentBet": 200,
          "totalBetThisHand": 600,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id50": {
          "id": "id50",
          "name": "You",
          "hand": ["Qc", "Jd"],
          "chips": 1200,
          "currentBet": 200,
          "totalBetThisHand": 400,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
      },
      "playerOrder": ["id49", "id50"],
      "currentTurnPlayerId": "id50",
      "activePlayerIds": ["id49", "id50"],
      "pots": [
        {
          "amount": 1000,
          "eligiblePlayerIds": ["id49", "id50"],
        },
      ],
      "currentBet": 200,
      "currentStreet": "turn",
      "smallBlindId": "id49",
      "bigBlindId": "id50",
      "dealerId": "id49",
      "handResults": null,
    };
  }

  static Map<String, dynamic> getAllInScenario() {
    return {
      "communityCards": ["As", "Ad", "Ac"],
      "players": {
        "id49": {
          "id": "id49",
          "name": "Alice",
          "hand": ["Ks", "Kh"],
          "chips": 0,
          "currentBet": 1000,
          "totalBetThisHand": 1000,
          "hasFolded": false,
          "isAllIn": true,
          "hasLeft": false,
        },
        "id50": {
          "id": "id50",
          "name": "Bob",
          "hand": ["Qd", "Qc"],
          "chips": 0,
          "currentBet": 800,
          "totalBetThisHand": 800,
          "hasFolded": false,
          "isAllIn": true,
          "hasLeft": false,
        },
        "id51": {
          "id": "id51",
          "name": "You",
          "hand": ["Ah", "Kd"],
          "chips": 0,
          "currentBet": 1000,
          "totalBetThisHand": 1000,
          "hasFolded": false,
          "isAllIn": true,
          "hasLeft": false,
        },
      },
      "playerOrder": ["id49", "id50", "id51"],
      "currentTurnPlayerId": "",
      "activePlayerIds": ["id49", "id50", "id51"],
      "pots": [
        {
          "amount": 2400,
          "eligiblePlayerIds": ["id49", "id50", "id51"],
        },
        {
          "amount": 400,
          "eligiblePlayerIds": ["id49", "id51"],
        },
      ],
      "currentBet": 1000,
      "currentStreet": "flop",
      "smallBlindId": "id50",
      "bigBlindId": "id51",
      "dealerId": "id49",
      "handResults": null,
    };
  }

  static Map<String, dynamic> getHeadsUpScenario() {
    return {
      "communityCards": ["Jh", "Jd", "5c", "2s"],
      "players": {
        "id49": {
          "id": "id49",
          "name": "Opponent",
          "hand": ["Kh", "Qh"],
          "chips": 1500,
          "currentBet": 300,
          "totalBetThisHand": 500,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id50": {
          "id": "id50",
          "name": "You",
          "hand": ["Js", "Tc"],
          "chips": 1500,
          "currentBet": 0,
          "totalBetThisHand": 200,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
      },
      "playerOrder": ["id49", "id50"],
      "currentTurnPlayerId": "id50",
      "activePlayerIds": ["id49", "id50"],
      "pots": [
        {
          "amount": 700,
          "eligiblePlayerIds": ["id49", "id50"],
        },
      ],
      "currentBet": 300,
      "currentStreet": "turn",
      "smallBlindId": "id50",
      "bigBlindId": "id49",
      "dealerId": "id50",
      "handResults": null,
    };
  }

  static Map<String, dynamic> getMultiPotScenario() {
    return {
      "communityCards": ["Kh", "Kd", "Ks", "3c", "3d"],
      "players": {
        "id49": {
          "id": "id49",
          "name": "Alice",
          "hand": ["Ac", "Ah"],
          "chips": 0,
          "currentBet": 500,
          "totalBetThisHand": 500,
          "hasFolded": false,
          "isAllIn": true,
          "hasLeft": false,
        },
        "id50": {
          "id": "id50",
          "name": "Bob",
          "hand": ["Qc", "Qd"],
          "chips": 0,
          "currentBet": 800,
          "totalBetThisHand": 800,
          "hasFolded": false,
          "isAllIn": true,
          "hasLeft": false,
        },
        "id51": {
          "id": "id51",
          "name": "Charlie",
          "hand": ["Jh", "Th"],
          "chips": 200,
          "currentBet": 1200,
          "totalBetThisHand": 1200,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id52": {
          "id": "id52",
          "name": "You",
          "hand": ["Kc", "3h"],
          "chips": 100,
          "currentBet": 1200,
          "totalBetThisHand": 1200,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
      },
      "playerOrder": ["id49", "id50", "id51", "id52"],
      "currentTurnPlayerId": "id51",
      "activePlayerIds": ["id49", "id50", "id51", "id52"],
      "pots": [
        {
          "amount": 2000,
          "eligiblePlayerIds": ["id49", "id50", "id51", "id52"],
        },
        {
          "amount": 900,
          "eligiblePlayerIds": ["id50", "id51", "id52"],
        },
        {
          "amount": 800,
          "eligiblePlayerIds": ["id51", "id52"],
        },
      ],
      "currentBet": 1200,
      "currentStreet": "river",
      "smallBlindId": "id50",
      "bigBlindId": "id51",
      "dealerId": "id49",
      "handResults": null,
    };
  }

  static Map<String, dynamic> getBigTableScenario() {
    return {
      "communityCards": ["2c", "2d", "Kh", "Qs", "Ad"],
      "players": {
        "id49": {
          "id": "id49",
          "name": "Alice",
          "hand": ["Jh", "Jd"],
          "chips": 900,
          "currentBet": 100,
          "totalBetThisHand": 150,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id50": {
          "id": "id50",
          "name": "Bob",
          "hand": ["7c", "6c"],
          "chips": 850,
          "currentBet": 0,
          "totalBetThisHand": 50,
          "hasFolded": true,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id51": {
          "id": "id51",
          "name": "Charlie",
          "hand": ["Kd", "Qd"],
          "chips": 1100,
          "currentBet": 100,
          "totalBetThisHand": 150,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id52": {
          "id": "id52",
          "name": "Diana",
          "hand": ["Ac", "Tc"],
          "chips": 950,
          "currentBet": 100,
          "totalBetThisHand": 150,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id53": {
          "id": "id53",
          "name": "Eve",
          "hand": ["8h", "7h"],
          "chips": 800,
          "currentBet": 0,
          "totalBetThisHand": 100,
          "hasFolded": true,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id54": {
          "id": "id54",
          "name": "You",
          "hand": ["As", "Ks"],
          "chips": 1000,
          "currentBet": 100,
          "totalBetThisHand": 150,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
      },
      "playerOrder": ["id49", "id50", "id51", "id52", "id53", "id54"],
      "currentTurnPlayerId": "id51",
      "activePlayerIds": ["id49", "id51", "id52", "id54"],
      "pots": [
        {
          "amount": 750,
          "eligiblePlayerIds": ["id49", "id50", "id51", "id52", "id53", "id54"],
        },
      ],
      "currentBet": 100,
      "currentStreet": "river",
      "smallBlindId": "id53",
      "bigBlindId": "id54",
      "dealerId": "id52",
      "handResults": null,
    };
  }

  static Map<String, dynamic> getYourTurnPreflopScenario() {
    return {
      "communityCards": [],
      "players": {
        "id49": {
          "id": "id49",
          "name": "Alice",
          "hand": ["Ts", "Td"],
          "chips": 950,
          "currentBet": 50,
          "totalBetThisHand": 50,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id50": {
          "id": "id50",
          "name": "Bob",
          "hand": ["9c", "9h"],
          "chips": 900,
          "currentBet": 100,
          "totalBetThisHand": 100,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id51": {
          "id": "id51",
          "name": "Charlie",
          "hand": ["Ac", "Kc"],
          "chips": 800,
          "currentBet": 200,
          "totalBetThisHand": 200,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
        "id52": {
          "id": "id52",
          "name": "You",
          "hand": ["Qh", "Qd"],
          "chips": 1000,
          "currentBet": 0,
          "totalBetThisHand": 0,
          "hasFolded": false,
          "isAllIn": false,
          "hasLeft": false,
        },
      },
      "playerOrder": ["id49", "id50", "id51", "id52"],
      "currentTurnPlayerId": "id52",
      "activePlayerIds": ["id49", "id50", "id51", "id52"],
      "pots": [
        {
          "amount": 350,
          "eligiblePlayerIds": ["id49", "id50", "id51", "id52"],
        },
      ],
      "currentBet": 200,
      "currentStreet": "pre-flop",
      "smallBlindId": "id49",
      "bigBlindId": "id50",
      "dealerId": "id52",
      "handResults": null,
    };
  }

  // Helper methods for test player IDs
  static String getTestPlayerId() => "id52";
  static String getTestPlayerIdPreflop() => "id51";
  static String getTestPlayerIdFlop() => "id52";
  static String getTestPlayerIdTurn() => "id50";
  static String getTestPlayerIdAllIn() => "id51";
  static String getTestPlayerIdHeadsUp() => "id50";
  static String getTestPlayerIdMultiPot() => "id52";
  static String getTestPlayerIdBigTable() => "id54";
  static String getTestPlayerIdYourTurnPreflop() => "id52";
}
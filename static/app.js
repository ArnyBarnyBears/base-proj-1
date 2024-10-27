const contractAddress = "0x90baf68f447cf470c880ff5beb5c7b362e93e7a8"; // Replace with actual contract address
let web3;
let diceContract;

window.addEventListener('load', async () => {
    // Step 1: Check for MetaMask and connect
    if (window.ethereum) {
        console.log("MetaMask detected. Attempting to connect...");
        web3 = new Web3(window.ethereum);

        try {
            // Request account access
            await ethereum.request({ method: 'eth_requestAccounts' });
            console.log("MetaMask account access granted.");

            // Step 2: Load ABI from message.txt
            const response = await fetch('/static/message.txt');
            if (!response.ok) throw new Error(`Error fetching ABI file: ${response.statusText}`);

            const contractABI = await response.json();
            console.log("Contract ABI loaded:", contractABI);

            // Step 3: Initialize contract
            diceContract = new web3.eth.Contract(contractABI, contractAddress);
            document.getElementById('status').innerText = "Connected to MetaMask! Click 'Join Game' to start.";
            console.log("Contract initialized successfully with ABI and address.");

        } catch (error) {
            console.error("Error connecting to MetaMask or loading ABI:", error);
            document.getElementById('status').innerText = "Failed to connect to MetaMask or load contract ABI.";
        }
    } else {
        alert('MetaMask is required to interact with this site.');
        console.error("MetaMask not detected.");
    }
});

// Function to join or create a game
async function joinOrCreateGame() {
    if (!diceContract) {
        console.error("Contract is not initialized.");
        document.getElementById('status').innerText = "Contract is not initialized. Please ensure MetaMask is connected.";
        return;
    }

    try {
        const accounts = await web3.eth.getAccounts();
        const playerAddress = accounts[0];
        console.log("Attempting to join or create a game with account:", playerAddress);

        document.getElementById('status').innerText = "Joining game...";

        // Send transaction with 0.0007 ETH as the stake
        const tx = await diceContract.methods.joinOrCreateGame().send({
            from: playerAddress,
            value: web3.utils.toWei('0.0007', 'ether')
        });

        console.log("Transaction sent:", tx);
        document.getElementById('status').innerText = "Waiting for a match...";

        // Listen for the PlayerMatched event
        diceContract.events.PlayerMatched()
            .on("data", (event) => {
                console.log("PlayerMatched event received:", event);
                const gameId = event.returnValues.gameId;
                document.getElementById('status').innerText = "Match found! Rolling the dice...";
                getGameResults(gameId); // Fetch game results
            })
            .on("error", (error) => {
                console.error("Error in PlayerMatched event listener:", error);
            });

        // Listen for the GameCompleted event
        diceContract.events.GameCompleted()
            .on("data", (event) => {
                console.log("GameCompleted event received:", event);
                const { gameId, winner, roll1, roll2 } = event.returnValues;
                document.getElementById('result').innerHTML = `
                    Game ${gameId} completed.<br>
                    Player 1 Roll: ${roll1}<br>
                    Player 2 Roll: ${roll2}<br>
                    Winner: ${winner}
                `;
                document.getElementById('status').innerText = "Game completed! Winner was paid.";
            })
            .on("error", (error) => {
                console.error("Error in GameCompleted event listener:", error);
            });

    } catch (error) {
        console.error("Failed to join or create game:", error);
        document.getElementById('status').innerText = "Failed to join game. Check MetaMask for errors.";
    }
}

// Function to get game results based on gameId
async function getGameResults(gameId) {
    try {
        console.log("Fetching game results for game ID:", gameId);
        const game = await diceContract.methods.getGame(gameId).call();
        document.getElementById('result').innerHTML = `
            Results:<br>
            Player 1 Roll: ${game.roll1}<br>
            Player 2 Roll: ${game.roll2}<br>
            Winner: ${game.winner}
        `;
        console.log("Game results fetched:", game);
    } catch (error) {
        console.error("Error retrieving game results:", error);
    }
}

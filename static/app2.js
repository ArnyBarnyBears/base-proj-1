const contractAddress = "0x2f217b8524b37f583daf49af36642d46e5b6f0cd"; // Replace with actual contract address
let web3;
let diceContract;

window.addEventListener('load', async () => {
    if (window.ethereum) {
        console.log("MetaMask detected. Attempting to connect...");
        web3 = new Web3(window.ethereum);

        try {
            await ethereum.request({ method: 'eth_requestAccounts' });
            console.log("MetaMask account access granted.");

            // Load the contract ABI from message.txt
            const response = await fetch('/static/message.txt');  // Adjust path if needed
            if (!response.ok) throw new Error(`Error fetching ABI file: ${response.statusText}`);

            const contractABI = await response.json();
            console.log("Contract ABI loaded:", contractABI);

            // Initialize the contract
            diceContract = new web3.eth.Contract(contractABI, contractAddress);
            document.getElementById('status').innerText = "Connected to MetaMask! Enter a stake and click 'Join Game' to start.";
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
        const stakeWei = document.getElementById('stakeInput').value;
        const accounts = await web3.eth.getAccounts();
        const playerAddress = accounts[0];
        console.log("Attempting to join or create a game with account:", playerAddress, "and stake:", stakeWei, "wei");

        document.getElementById('status').innerText = "Joining game...";

        const tx = await diceContract.methods.joinOrCreateGame().send({
            from: playerAddress,
            value: stakeWei
        });
        console.log("Transaction sent:", tx);

        console.log(tx)
        const gameId = tx.events?.GameCreated?.returnValues?.gameId;
        if (gameId !== undefined) {
            let intervalId = setInterval(function() {
                if (checkGameCompletion(gameId)) {
                    clearInterval(intervalId); // Stops the interval when checkGameCompletion returns True
                }
            }, 5000);
        }


        document.getElementById('status').innerText = "Waiting for a match...";
    } catch (error) {
        console.error("Failed to join or create game:", error);
        document.getElementById('status').innerText = "Failed to join game. Check MetaMask for errors.";
    }
}

// async function joinOrCreateGame() {
//     if (!diceContract) {
//         console.error("Contract is not initialized.");
//         document.getElementById('status').innerText = "Contract is not initialized. Please ensure MetaMask is connected.";
//         return;
//     }

//     try {
//         const accounts = await web3.eth.getAccounts();
//         const playerAddress = accounts[0];
//         console.log("Attempting to join or create a game with account:", playerAddress);

//         document.getElementById('status').innerText = "Joining game...";

//         // Send transaction with 0.0007 ETH as the stake
//         const tx = await diceContract.methods.joinOrCreateGame().send({
//             from: playerAddress,
//             value: web3.utils.toWei('0.0007', 'ether')
//         });

//         console.log("Transaction sent:", tx);

//         // Get gameId from the return values of the event
//         const gameId = tx.events.GameCompleted.returnValues.gameId;
//         console.log("Game created with ID:", gameId);

//         // Fetch and check game details by gameId
//         checkGameCompletion(gameId);
        
//     } catch (error) {
//         console.error("Failed to join or create game:", error);
//         document.getElementById('status').innerText = "Failed to join game. Check MetaMask for errors.";
//     }
// }

async function checkGameCompletion(gameId) {
    try {
        console.log("Fetching game details for game ID:", gameId);
        
        // Fetch game details
        const gameDetails = await diceContract.methods.games(gameId).call();
        console.log("Game details fetched:", gameDetails);

        // Check if game state is 2 (Completed)
        if (gameDetails.State === "2") {
            alert("Something is complete")
            document.getElementById('status').innerText = "Game completed!";
            document.getElementById('result').innerHTML = `
                Game ID: ${gameId}<br>
                Player 1 Roll: ${gameDetails.roll1}<br>
                Player 2 Roll: ${gameDetails.roll2}<br>
                Winner: ${gameDetails.winner}
            `;
            console.log("Game is completed with state 2. Displaying results.");
            return true;
        } else {
            document.getElementById('status').innerText = "Game is not completed yet. Waiting for completion...";
            console.log("Game is still in progress. Current state:", gameDetails.State);
            return false;
        }
    } catch (error) {
        console.error("Error retrieving game details:", error);
    }
}


// Function to get the fee percentage
async function getFeePercentage() {
    try {
        const feePercentage = await diceContract.methods.FEE_PERCENTAGE().call();
        document.getElementById('feePercentage').innerText = `Fee Percentage: ${feePercentage}%`;
        console.log("Fee Percentage:", feePercentage);
    } catch (error) {
        console.error("Error fetching fee percentage:", error);
    }
}

// Function to get the game ID counter
async function getGameIdCounter() {
    try {
        const gameIdCounter = await diceContract.methods.gameIdCounter().call();
        document.getElementById('gameIdCounter').innerText = `Game ID Counter: ${gameIdCounter}`;
        console.log("Game ID Counter:", gameIdCounter);
    } catch (error) {
        console.error("Error fetching game ID counter:", error);
    }
}

// Function to get the open game ID
async function getOpenGameId() {
    try {
        const openGameId = await diceContract.methods.openGameId().call();
        document.getElementById('openGameId').innerText = `Open Game ID: ${openGameId}`;
        console.log("Open Game ID:", openGameId);
    } catch (error) {
        console.error("Error fetching open game ID:", error);
    }
}

// Function to get game details by game ID
async function getGameDetails() {
    try {
        const gameId = document.getElementById('gameIdInput').value;
        const game = await diceContract.methods.games(gameId).call();
        
        // Display game details in a readable format
        document.getElementById('gameDetails').innerText = `
            Game ID: ${gameId}
            Player 1: ${game.player1}
            Player 2: ${game.player2}
            Stake 1: ${game.stake1} wei
            Stake 2: ${game.stake2} wei
            Minimum Stake: ${game.minStake} wei
            Roll 1: ${game.roll1}
            Roll 2: ${game.roll2}
            Winner: ${game.winner}
            State: ${['Waiting', 'InProgress', 'Completed'][game.state]}
        `;
        console.log("Game Details:", game);
    } catch (error) {
        console.error("Error fetching game details:", error);
    }
}

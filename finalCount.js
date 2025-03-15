function getCount()
{
    const query = "SELECT region, party1_votes, party2_votes FROM finalCount";

        db.query(query, (err, results) => {
            if (err) {
                console.error("Error fetching data: " + err.stack);
                return;
            }

            let party1Wins = 0;
            let party2Wins = 0;
            let drawCount = 0;

            console.log("\nRegional Winners:");
            results.forEach(row => {
                const { region, party1_votes, party2_votes } = row;
                
                if (party1_votes > party2_votes) {
                    console.log(`${region}: RLP wins with ${party1_votes} votes`);
                    party1Wins++;
                } else if (party2_votes > party1_votes) {
                    console.log(`${region}: LLP wins with ${party2_votes} votes`);
                    party2Wins++;
                } else {
                    console.log(`${region}: Draw with ${party1_votes} votes each`);
                    drawCount++;
                }
            });

            console.log("\nFinal Results:");
            console.log(`RLP won in ${party1Wins} regions`);
            console.log(`LLP won in ${party2Wins} regions`);
            console.log(`Draw in ${drawCount} regions`);

            if (party1Wins > party2Wins) {
                console.log("RLP is the overall winner!");
            } else if (party2Wins > party1Wins) {
                console.log("LLP is the overall winner!");
            } else {
                console.log("It's a tie!");
            }
        });
}


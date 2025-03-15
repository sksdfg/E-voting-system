document.addEventListener("DOMContentLoaded", function () {
    fetch("http://localhost:3000/partyInfo")
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById("partyList");
            data.forEach(party => {
                const partyCard = document.createElement("div");
                partyCard.className = "party-card";
                partyCard.innerHTML = `
                    <img src="${party.image_url}" alt="${party.party_name}">
                    <h3>${party.party_name}</h3>
                    <p class="manifesto">${party.manifesto}</p>
                `;
                container.appendChild(partyCard);
            });
        })
        .catch(error => console.error("Error fetching party info:", error));
});

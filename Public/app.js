document.addEventListener("DOMContentLoaded", () => {
    // Fetch party info on page load
    fetchPartyInfo();

    // Check if the user is already logged in and load candidates
    const voterId = sessionStorage.getItem("voterId");
    const region = sessionStorage.getItem("region");
    const hasVoted = sessionStorage.getItem("hasVoted") === "true";

    if (voterId && region) {
        fetchCandidates(region, voterId, hasVoted);
    }

    // Attach event listener for registration form submission
    document.getElementById("registerForm").addEventListener("submit", register);
    
    // Attach event listener for updating user info
    document.getElementById("updateUserBtn").addEventListener("click", updateUserInfo);
});

// Function to fetch party information and display it
async function fetchPartyInfo() {
    try {
        const response = await fetch("/partyInfo");
        const data = await response.json();
        const container = document.getElementById("partyList");
        container.innerHTML = ""; // Clear existing content

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
    } catch (error) {
        console.error("Error fetching party info:", error);
    }
}

// Function to register a voter
async function register(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const user = document.getElementById("user").value;
    const password = document.getElementById("registerPassword").value;
    const region = document.getElementById("region").value;

    try {
        const response = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, user, password, region })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || "Something went wrong");
        }

        alert(result.message);

        // Clear form inputs
        document.getElementById("name").value = "";
        document.getElementById("user").value = "";
        document.getElementById("registerPassword").value = "";
        document.getElementById("region").value = "";

    } catch (error) {
        alert(error.message);
    }
}

// Function to log in
async function login() {
    const voterId = document.getElementById("voterId").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("loginPassword").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId, username, password })
    });

    const data = await response.json();
    const messageDiv = document.getElementById("message");

    if (data.success) {
        sessionStorage.setItem("region", data.region);
        sessionStorage.setItem("voterId", voterId);
        sessionStorage.setItem("hasVoted", data.has_voted ? "true" : "false");
        sessionStorage.setItem("name", data.name);

        if (data.has_voted) {
            messageDiv.innerHTML = `<p class="success-message">${data.name}, your vote has been recorded successfully!</p>`;
        } else {
            messageDiv.innerHTML = `<p class="success-message">Welcome, ${data.name} from ${data.region}</p>`;
            fetchCandidates(data.region, voterId, data.has_voted);
        }
    } else {
        messageDiv.innerHTML = `<p class="error-message">${data.message}</p>`;
    }

    clearLoginInputs();
}

// Function to fetch candidates based on the voter's region
async function fetchCandidates(region, voterId, hasVoted) {
    try {
        const response = await fetch(`/candidates?region=${region}`);
        const candidates = await response.json();

        const candidateList = document.getElementById("candidateList");
        candidateList.innerHTML = "";
        document.getElementById("candidates").classList.remove("hidden");

        candidates.forEach(candidate => {
            const div = document.createElement("div");
            div.classList.add("candidate");

            div.innerHTML = `
                <img src="${candidate.image_url}" alt="Candidate" width="100">
                <p>${candidate.name} - ${candidate.party_id}</p>
                <button onclick="vote('${voterId}', '${candidate.party_id}', '${region}')" ${hasVoted ? "disabled" : ""}>
                    VOTE
                </button>
            `;
            candidateList.appendChild(div);
        });
    } catch (error) {
        console.error("Error fetching candidates:", error);
    }
}

// Function to submit the vote
async function vote(voterId, partyId, region) {
    try {
        const response = await fetch("/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ voterId, partyId, region })
        });

        const data = await response.json();
        const messageDiv = document.getElementById("message");

        if (data.success) {
            messageDiv.innerHTML = `<p class="success-message">${data.message}</p>`;
            document.querySelectorAll("button").forEach(btn => btn.disabled = true);
            sessionStorage.setItem("hasVoted", "true");
        } else {
            messageDiv.innerHTML = `<p class="error-message">${data.message}</p>`;
        }
    } catch (error) {
        console.error("Error submitting vote:", error);
        document.getElementById("message").innerHTML = `<p class="error-message">Something went wrong. Try again.</p>`;
    }
}

// Function to update user information
async function updateUserInfo() {
    const voterId = document.getElementById("updateId").value;
    const oldPassword = document.getElementById("oldPassword").value;
    const newName = document.getElementById("updateName").value;
    const newUsername = document.getElementById("updateUsername").value;
    const newPassword = document.getElementById("updatePassword").value;

    if (!voterId || !newUsername || !newPassword) {
        alert("All fields are required!");
        return;
    }

    try {
        const response = await fetch("/updateUserInfo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ voterId,oldPassword , newName, newUsername, newPassword })
        });

        const data = await response.json();
        alert(data.message);

        if (data.success) {
            document.getElementById("updateUserForm").classList.add("hidden");
        }
    } catch (error) {
        console.error("Error updating user info:", error);
        alert("An error occurred while updating. Please try again.");
    }

    clearUpdateInputs();
}

// Function to toggle update user info form
function toggleUpdateUserForm() {
    document.getElementById("updateUserForm").classList.toggle("hidden");
}

// Function to clear input fields for Login
function clearLoginInputs() {
    document.getElementById("voterId").value = "";
    document.getElementById("username").value = "";
    document.getElementById("loginPassword").value = "";
}

// Function to clear input fields for Update User Info
function clearUpdateInputs() {
    document.getElementById("updateId").value = "";
    document.getElementById("updateName").value = "";
    document.getElementById("updateUsername").value = "";
    document.getElementById("updatePassword").value = "";
}
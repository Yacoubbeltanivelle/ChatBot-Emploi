function afficherResultat() {
    const infoEntreprise = document.getElementById('infoEntreprise').value;
    const infoUtilisateur = document.getElementById('infoUtilisateur').value;
    const resultat = `Entreprise: ${infoEntreprise} | Utilisateur: ${infoUtilisateur}`;
    document.getElementById('resultat').innerText = resultat;
}


document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    if (message) {
        addMessageToChat('Vous', message);
        userInput.value = '';
        fetchResponseFromOpenAI(message);
    }
}

function addMessageToChat(sender, message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = `${sender}: ${message}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function fetchResponseFromOpenAI(message) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer YOUR_API_KEY`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: message }]
        })
    });

    const data = await response.json();
    const botMessage = data.choices[0].message.content;
    addMessageToChat('Bot', botMessage);
}
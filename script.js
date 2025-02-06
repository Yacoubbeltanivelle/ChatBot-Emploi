let apiKey = '';

// Demande la clé API dès l'arrivée sur le site
function promptForApiKey() {
  apiKey = prompt("Veuillez entrer votre clé API OpenAI :");
  if (!apiKey) {
    alert("Une clé API est nécessaire pour utiliser ce chatbot.");
  }
}

document.addEventListener("DOMContentLoaded", promptForApiKey);

document.getElementById("send-button").addEventListener("click", sendMessage);
document.getElementById("user-input").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const userInput = document.getElementById("user-input");
  const message = userInput.value.trim();
  if (message) {
    addMessageToChat("Vous", message);
    userInput.value = "";
    fetchResponseFromOpenAI(message);
  }
}

function addMessageToChat(sender, message) {
  const messagesDiv = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.textContent = `${sender}: ${message}`;
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function fetchResponseFromOpenAI(message) {
  if (!apiKey) {
    alert("Veuillez entrer une clé valide.");
    promptForApiKey();
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur : ${response.status}`);
    }

    const data = await response.json();
    const botMessage = data.choices[0].message.content;
    addMessageToChat("ChatBot Emploi", botMessage);
  } catch (error) {
    addMessageToChat("Erreur", error.message);
  }
}
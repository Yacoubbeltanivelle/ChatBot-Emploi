let apiKey = "";
let conversationHistory = [];

// Demande la clé API dès l'arrivée sur le site
function promptForApiKey() {
  apiKey =
    localStorage.getItem("apiKey") ||
    prompt("Veuillez entrer votre clé API OpenAI :");
  if (!apiKey) {
    alert("Une clé API est nécessaire pour utiliser ce chatbot.");
  } else {
    localStorage.setItem("apiKey", apiKey);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  promptForApiKey();
  loadMessagesFromLocalStorage();
});

document.getElementById("send-button").addEventListener("click", sendMessage);
document
  .getElementById("user-input")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

function sendMessage() {
  const userInput = document.getElementById("user-input");
  const message = userInput.value.trim();
  if (message) {
    addMessageToChat("Vous", message);
    saveMessageToLocalStorage("Vous", message);
    updateConversationHistory("user", message);
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

function saveMessageToLocalStorage(sender, message) {
  const messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
  messages.push({ sender, message });
  localStorage.setItem("chatMessages", JSON.stringify(messages));
}

function loadMessagesFromLocalStorage() {
  const messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
  messages.forEach(({ sender, message }) => {
    addMessageToChat(sender, message);
  });
}

function updateConversationHistory(role, content) {
  conversationHistory.push({ role, content });
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
        messages: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur : ${response.status}`);
    }

    const data = await response.json();
    const botMessage = data.choices[0].message.content;
    addMessageToChat("ChatBot Emploi", botMessage);
    saveMessageToLocalStorage("ChatBot Emploi", botMessage);
    updateConversationHistory("assistant", botMessage);
  } catch (error) {
    addMessageToChat("Erreur", error.message);
  }
}

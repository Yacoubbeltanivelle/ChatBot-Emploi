let apiKey = "";
let conversationHistory = [];

document.addEventListener("DOMContentLoaded", () => {
  promptForApiKey();
  loadMessagesFromLocalStorage();
  listSavedConversations();
});

document.getElementById("send-button").addEventListener("click", sendMessage);
document
  .getElementById("user-input")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

document
  .getElementById("new-chat-button")
  .addEventListener("click", startNewChat);

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

function getConversationNames() {
  return JSON.parse(localStorage.getItem("conversationNames")) || {};
}

function saveConversationNames(names) {
  localStorage.setItem("conversationNames", JSON.stringify(names));
}

function listSavedConversations() {
  const conversationListDiv = document.getElementById("conversation-list");
  conversationListDiv.innerHTML = "";

  const conversationNames = getConversationNames();

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("chatHistory_")) {
      const conversationDiv = createConversationDiv(
        key,
        conversationNames[key]
      );
      conversationListDiv.appendChild(conversationDiv);
    }
  });
}

function createConversationDiv(key, displayName) {
  const conversationDiv = document.createElement("div");
  conversationDiv.style.display = "flex";
  conversationDiv.style.alignItems = "center";
  conversationDiv.style.marginBottom = "5px";

  const button = createButton(
    displayName || key.replace("chatHistory_", "Conversation "),
    () => loadConversation(key)
  );
  const renameButton = createButton("Renommer", () => renameConversation(key));
  const deleteButton = createButton(
    "Supprimer",
    () => deleteConversation(key),
    "red",
    "white"
  );

  conversationDiv.appendChild(button);
  conversationDiv.appendChild(renameButton);
  conversationDiv.appendChild(deleteButton);

  return conversationDiv;
}

function createButton(text, onClick, backgroundColor = "", textColor = "") {
  const button = document.createElement("button");
  button.textContent = text;
  button.style.marginRight = "10px";
  button.style.backgroundColor = backgroundColor;
  button.style.color = textColor;
  button.addEventListener("click", onClick);
  return button;
}

function renameConversation(key) {
  const newName = prompt("Entrez le nouveau nom pour cette conversation :");
  if (newName) {
    const conversationNames = getConversationNames();
    conversationNames[key] = newName;
    saveConversationNames(conversationNames);
    listSavedConversations();
  }
}

function deleteConversation(key) {
  if (confirm("Voulez-vous vraiment supprimer cette conversation ?")) {
    localStorage.removeItem(key);
    listSavedConversations();
  }
}

function loadConversation(key) {
  const savedConversation = JSON.parse(localStorage.getItem(key));
  if (savedConversation) {
    conversationHistory = savedConversation;
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = "";

    savedConversation.forEach(({ role, content }) => {
      const sender = role === "user" ? "Vous" : "ChatBot Emploi";
      addMessageToChat(sender, content);
    });
  }
}

function sendMessage() {
  const userInput = document.getElementById("user-input");
  const message = userInput.value.trim();
  if (message) {
    if (conversationHistory.length === 0) {
      const timestamp = new Date().toISOString();
      localStorage.setItem(
        `chatHistory_${timestamp}`,
        JSON.stringify(conversationHistory)
      );
      listSavedConversations();
    }
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

function startNewChat() {
  const timestamp = new Date().toISOString();
  localStorage.setItem(
    `chatHistory_${timestamp}`,
    JSON.stringify(conversationHistory)
  );

  conversationHistory = [];

  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  localStorage.removeItem("chatMessages");
}

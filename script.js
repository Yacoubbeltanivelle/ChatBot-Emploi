let apiKey = "";
let conversationHistory = [];
let currentConversationKey = null;

document.addEventListener("DOMContentLoaded", () => {
  promptForApiKey();
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

function getChatListHistory() {
  return JSON.parse(localStorage.getItem("chatListHistory")) || [];
}

function saveChatListHistory(chatList) {
  localStorage.setItem("chatListHistory", JSON.stringify(chatList));
}

function listSavedConversations() {
  const conversationListDiv = document.getElementById("conversation-list");
  conversationListDiv.innerHTML = "";

  const chatList = getChatListHistory();

  chatList.forEach((chat, index) => {
    const conversationDiv = createConversationDiv(index, chat.name);
    conversationListDiv.appendChild(conversationDiv);
  });
}

function createConversationDiv(index, displayName) {
  const conversationDiv = document.createElement("div");
  conversationDiv.style.display = "flex";
  conversationDiv.style.alignItems = "center";
  conversationDiv.style.marginBottom = "5px";

  const button = createButton(displayName || `Conversation ${index + 1}`, () =>
    loadConversation(index)
  );
  const renameButton = createButton("Renommer", () =>
    renameConversation(index)
  );
  const deleteButton = createButton(
    "Supprimer",
    () => deleteConversation(index),
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

function renameConversation(index) {
  const newName = prompt("Entrez le nouveau nom pour cette conversation :");
  if (newName) {
    const chatList = getChatListHistory();
    chatList[index].name = newName;
    saveChatListHistory(chatList);
    listSavedConversations();
  }
}

function deleteConversation(index) {
  if (confirm("Voulez-vous vraiment supprimer cette conversation ?")) {
    const chatList = getChatListHistory();
    chatList.splice(index, 1);
    saveChatListHistory(chatList);
    listSavedConversations();
  }
}

function loadConversation(index) {
  const chatList = getChatListHistory();
  const savedConversation = chatList[index];
  if (savedConversation) {
    conversationHistory = savedConversation.history;
    currentConversationKey = index;
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = "";

    savedConversation.history.forEach(({ role, content }) => {
      const sender = role === "user" ? "Vous" : "ChatBot Emploi";
      addMessageToChat(sender, content);
    });
  }
}

function sendMessage() {
  const userInput = document.getElementById("user-input");
  const message = userInput.value.trim();
  if (message) {
    if (conversationHistory.length === 0 || currentConversationKey === null) {
      const chatList = getChatListHistory();

      // Extraire les 4 premiers mots pour le nom de la conversation
      const words = message.split(" ");
      const conversationName =
        words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");

      const newConversation = {
        name: conversationName,
        history: [],
      };
      chatList.push(newConversation);
      currentConversationKey = chatList.length - 1;
      saveChatListHistory(chatList);
      listSavedConversations();
    }
    addMessageToChat("Vous", message);
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

function updateConversationHistory(role, content) {
  conversationHistory.push({ role, content });
  const chatList = getChatListHistory();
  chatList[currentConversationKey].history = conversationHistory;
  saveChatListHistory(chatList);
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
    updateConversationHistory("assistant", botMessage);
  } catch (error) {
    addMessageToChat("Erreur", error.message);
  }
}

function startNewChat() {
  conversationHistory = [];
  currentConversationKey = null;

  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  localStorage.removeItem("chatMessages");
}

document
  .getElementById("new-chat-button")
  .addEventListener("click", startNewChat);


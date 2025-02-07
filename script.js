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

  const button = createButton(displayName || `Conversation ${index + 1}`, () =>
    loadConversation(index)
  );
  const renameButton = createButton(
    '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>',
    () => renameConversation(index)
  );
  const deleteButton = createButton(
    '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>',
    () => deleteConversation(index)
  );

  conversationDiv.appendChild(button);
  conversationDiv.appendChild(renameButton);
  conversationDiv.appendChild(deleteButton);

  return conversationDiv;
}

function createButton(text, onClick) {
  const button = document.createElement("button");
  button.innerHTML = text;
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

  // Faites défiler la boîte de chat vers le bas
  scrollToBottom();
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

  // Ajouter un indicateur de chargement
  addMessageToChat("ChatBot Emploi", "...");

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

    // Supprimer l'indicateur de chargement
    removeLastMessage();

    // Afficher le message mot par mot
    displayMessageWordByWord("ChatBot Emploi", botMessage);

    updateConversationHistory("assistant", botMessage);
  } catch (error) {
    addMessageToChat("Erreur", error.message);
  }
}

function removeLastMessage() {
  const messagesDiv = document.getElementById("messages");
  if (messagesDiv.lastChild) {
    messagesDiv.removeChild(messagesDiv.lastChild);
  }
}

function displayMessageWordByWord(sender, message) {
  const words = message.split(" ");
  let index = 0;
  const messagesDiv = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.textContent = `${sender}: `;
  messagesDiv.appendChild(messageElement);

  function displayNextWord() {
    if (index < words.length) {
      messageElement.textContent += words[index] + " ";
      index++;
      setTimeout(displayNextWord, 100); // Ajuste le délai ici pour la vitesse d'affichage

      // Faites défiler la boîte de chat vers le bas
      scrollToBottom();
    }
  }

  displayNextWord();
}

function scrollToBottom() {
  const chatBox = document.getElementById("chat-box");
  chatBox.scrollTop = chatBox.scrollHeight;
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

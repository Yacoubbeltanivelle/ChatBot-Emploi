let apiKey = "";

function promptForApiKey() {
  apiKey =
    localStorage.getItem("apiKey") ||
    prompt("Veuillez entrer votre clé API OpenAI :");
  if (!apiKey) {
    alert("Une clé API est nécessaire pour utiliser ce générateur.");
  } else {
    localStorage.setItem("apiKey", apiKey);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  promptForApiKey();
});

document.getElementById("generate-button").addEventListener("click", async () => {
  const jobInfo = document.getElementById("jobInfo").value.trim();
  const userName = document.getElementById("userName").value.trim();
  const userFirstName = document.getElementById("userFirstName").value.trim();
  const userEmail = document.getElementById("userEmail").value.trim();
  const userExperience = document.getElementById("userExperience").value.trim();

  if (!jobInfo || !userName || !userFirstName || !userEmail) {
    alert("Veuillez remplir tous les champs obligatoires.");
    return;
  }

  const prompt = `Rédige une lettre de motivation personnalisée pour une offre d'emploi décrite ainsi : "${jobInfo}". L'utilisateur s'appelle ${userFirstName} ${userName}, possède l'email ${userEmail} et son expérience professionnelle est la suivante : "${userExperience}".`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur : ${response.status}`);
    }

    const data = await response.json();
    const letter = data.choices[0].message.content;

    // Affiche la lettre de motivation dans le bloc résultat
    document.getElementById("letter-output").innerText = letter;
  } catch (error) {
    document.getElementById("letter-output").innerText = `Erreur: ${error.message}`;
  }
});

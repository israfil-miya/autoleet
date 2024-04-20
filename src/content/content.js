chrome.runtime.onMessage.addListener((message, _, __) => {
  if (message.action === "openCustomPopup") {
    openCustomPopup(message.data);
    console.log("Executed openCustomPopup");
  } else if (message.action === "getSelectedText") {
    let selectedText = handleParseSelectedText();
    chrome.runtime.sendMessage({
      action: "selectedText",
      selectedText,
      info: message.info,
      tab: message.tab,
    });
    console.log("Sent selected text to background.js");
  }
});

const handleParseSelectedText = () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const selectedText = selection.toString();
    return selectedText;
  } else {
    return "Unable to parse";
  }
};

// Function to open the custom popup
const openCustomPopup = (data) => {
  let popupOpen = false;

  if (popupOpen) {
    return;
  }

  popupOpen = true;

  const popupDiv = document.createElement("div");
  popupDiv.id = "customPopup";
  popupDiv.classList.add("popup-overlay");
  popupDiv.innerHTML = `
    <div class="popup-container">
      <button class="cancel-button" id="cancelButton">Close</button>
      <h3 id="heading">AUTOLEET</h3>
      <form id="customForm">
        <label for="codeTextArea">Parsed Code:</label>
        <textarea id="codeTextArea" name="code" placeholder="Enter code here...">${data.code}</textarea>
        <label for="languageInput">Language:</label>
        <input type="text" id="languageInput" name="language" placeholder="Enter language..." value="${data.language}">
        <label for="titleInput">Title:</label>
        <input type="text" id="titleInput" name="title" placeholder="Enter title..." value="${data.problem_name}">
        <label for="timeInput">Time Complexity:</label>
        <input type="text" id="timeInput" name="time" placeholder="Enter time complexity...">
        <label for="spaceInput">Space Complexity:</label>
        <input type="text" id="spaceInput" name="space" placeholder="Enter space complexity...">
        <label for="generatedCaption">Generated Caption Text:</label>
        <textarea id="generatedCaption" name="caption" placeholder="Caption..."></textarea>
        <br><br>
        <button id="submitBtn">Submit</button>
      </form>
    </div>
  `;

  document.body.appendChild(popupDiv);

  const codeInput = document.getElementById("codeTextArea");
  const languageInput = document.getElementById("languageInput");
  const titleInput = document.getElementById("titleInput");
  const spaceInput = document.getElementById("spaceInput");
  const timeInput = document.getElementById("timeInput");
  const generatedCaption = document.getElementById("generatedCaption");
  const submitButton = document.getElementById("submitBtn");
  const cancelButton = document.getElementById("cancelButton");

  // Add event listeners to update caption text dynamically
  languageInput.addEventListener("input", updateGeneratedCaption);
  titleInput.addEventListener("input", updateGeneratedCaption);
  spaceInput.addEventListener("input", updateGeneratedCaption);
  timeInput.addEventListener("input", updateGeneratedCaption);

  // Attach event listener for submit button only if it's not already attached
  if (!submitButton.onclick) {
    submitButton.addEventListener("click", handleSubmit);
  }

  cancelButton.addEventListener("click", closeCustomPopup);

  // Close the popup on Esc keypress
  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
      closeCustomPopup();
    }
  });


  function updateGeneratedCaption() {
    let captionText = `#Leetcode daily [${data.date}] - [${
      titleInput.value
    }]\n\n${languageInput.value ? "🔰 " + languageInput.value : ""}\n⏳ ${
      timeInput.value ? timeInput.value : ""
    } : Time\n📁 ${spaceInput.value ? spaceInput.value : ""} : Space`;
    generatedCaption.value = captionText;
  }
  updateGeneratedCaption(); // Update caption text initially

  function closeCustomPopup() {
    const popupDiv = document.getElementById("customPopup");
    if (popupDiv) {
      // Reset input fields
      codeInput.value = "";
      languageInput.value = "";
      titleInput.value = "";
      spaceInput.value = "";
      timeInput.value = "";
      generatedCaption.value = "";

      // Remove event listeners
      languageInput.removeEventListener("input", updateGeneratedCaption);
      titleInput.removeEventListener("input", updateGeneratedCaption);
      spaceInput.removeEventListener("input", updateGeneratedCaption);
      timeInput.removeEventListener("input", updateGeneratedCaption);
      cancelButton.removeEventListener("click", closeCustomPopup);
      submitButton.removeEventListener("click", handleSubmit);

      // Remove popup
      popupDiv.remove();
      popupOpen = false;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!popupOpen) {
      return;
    }

    chrome.runtime.sendMessage({
      action: "processedData",
      data: {
        language: languageInput.value,
        title: titleInput.value,
        complexity_space: spaceInput.value,
        complexity_time: timeInput.value,
        code: codeInput.value,
        caption: generatedCaption.value,
      },
    });

    closeCustomPopup();
  }
};

chrome.runtime.onMessage.addListener((message, _, __) => {
  if (message.action === "openCustomPopup") {
    openCustomPopup(message.data)
    console.log("Executed openCustomPopup");
  } else if (message.action === "getSelectedText") {
    let selectedText = handleParseSelectedText();
    chrome.runtime.sendMessage({ action: "selectedText", selectedText });
    console.log("Sent selected text to background.js")
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








let inputValues = {
  language: "",
  title: "",
  complexity_space: "",
  complexity_time: "",
  code: "",
  caption: "",
};

let submitClicked = false; // Flag to track if the submit button was clicked

handleSendData = () => {
  if (submitClicked) {
    chrome.runtime.sendMessage({
      action: "processedData",
      data: inputValues,
    });
    submitClicked = false; // Reset the flag after sending the message
  }
}

let popupOpen = false;
function openCustomPopup(data) {
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
        <label for="spaceInput">Space Complexity:</label>
        <input type="text" id="spaceInput" name="space" placeholder="Enter space complexity...">
        <label for="timeInput">Time Complexity:</label>
        <input type="text" id="timeInput" name="time" placeholder="Enter time complexity...">
        <label for="generatedCaption">Generated Caption Text:</label>
        <textarea id="generatedCaption" name="caption" placeholder="Caption..."></textarea>
        <br><br>
        <button id="submitBtn">Submit</button>
      </form>
    </div>
  `;

  document.body.appendChild(popupDiv);

  console.log("Executed append child");

  var languageInput = document.getElementById("languageInput");
  var titleInput = document.getElementById("titleInput");
  var spaceInput = document.getElementById("spaceInput");
  var timeInput = document.getElementById("timeInput");
  var generatedCaption = document.getElementById("generatedCaption");

  console.log("Executed get elements");

  // Update caption text initially
  updateGeneratedCaption();

  console.log("Executed set generated caption initial");

  // Add event listeners to update caption text dynamically
  languageInput.addEventListener("input", updateGeneratedCaption);
  titleInput.addEventListener("input", updateGeneratedCaption);
  spaceInput.addEventListener("input", updateGeneratedCaption);
  timeInput.addEventListener("input", updateGeneratedCaption);

  console.log("Executed added event listeners");

  const submitButton = document.getElementById("submitBtn");

  // Check if there's already an event listener attached to the submit button
  console.log("Existing event listeners for submitButton:", submitButton.onclick);

  // Attach event listener for submit button only if it's not already attached
  if (!submitButton.onclick) {
    submitButton.addEventListener("click", handleSubmit);
    console.log("Executed added submit button listener");
  } else {
    console.log("Submit button listener already exists");
  }

  const cancelButton = document.getElementById("cancelButton");

  cancelButton.addEventListener("click", closeCustomPopup);

  console.log("Executed added cancel button listener", cancelButton);

  function updateGeneratedCaption() {
    let captionText = `#Leetcode daily [${data.date}] - [${titleInput.value
      }]\n\n${languageInput.value ? "🔰 " + languageInput.value : ""}\n${timeInput.value ? "⏳ " + timeInput.value + " : Time" : ""
      }\n${spaceInput.value ? "📁 " + spaceInput.value + " : Space" : ""}`;
    generatedCaption.value = captionText;
  }

  function closeCustomPopup(event) {
    console.log("Executed closeCustomPopup function");

    const popupDiv = document.getElementById("customPopup");
    if (popupDiv) {
      // Reset input fields
      const languageInput = document.getElementById("languageInput");
      const titleInput = document.getElementById("titleInput");
      const spaceInput = document.getElementById("spaceInput");
      const timeInput = document.getElementById("timeInput");
      const generatedCaption = document.getElementById("generatedCaption");

      languageInput.value = "";
      titleInput.value = "";
      spaceInput.value = "";
      timeInput.value = "";
      generatedCaption.value = "";

      console.log('Executed set values to " " ');

      languageInput.removeEventListener("input", updateGeneratedCaption);
      titleInput.removeEventListener("input", updateGeneratedCaption);
      spaceInput.removeEventListener("input", updateGeneratedCaption);
      timeInput.removeEventListener("input", updateGeneratedCaption);
      cancelButton.removeEventListener("click", closeCustomPopup);
      submitButton.removeEventListener("click", handleSubmit);

      console.log("Executed removed event listeners");

      // Remove popup
      popupDiv.remove();

      console.log("Executed removed popup");

      // Reset submitClicked flag
      submitClicked = false;

      popupOpen = false;
    }
  }

  function handleSubmit(event) {
    console.log("Executed submit function");

    event.preventDefault();
    if (!popupOpen) {
      return;
    }

    submitClicked = true; // Set flag to indicate submission via submit button

    inputValues.language = languageInput.value;
    inputValues.title = titleInput.value;
    inputValues.complexity_space = spaceInput.value;
    inputValues.complexity_time = timeInput.value;
    inputValues.code = document.getElementById("codeTextArea").value;
    inputValues.caption = generatedCaption.value;

    handleSendData();

    closeCustomPopup();
  }
}

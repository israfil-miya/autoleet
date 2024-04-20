chrome.runtime.onMessage.addListener((message, _, __) => {
  if (message.action === "openCustomPopup") {
    openCustomPopup(message.data);
  } else if (message.action === "getSelectedText") {
    let selectedText = handleParseSelectedText();
    chrome.runtime.sendMessage({ action: "selectedText", selectedText });
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
        <button type="submit">Submit</button>
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

  const form = document.getElementById("customForm");

  const submitButton = document.querySelector(
    "#customForm button[type=submit]"
  );
  submitButton.addEventListener("click", handleSubmit);

  const cancelButton = document.getElementById("cancelButton");
  cancelButton.addEventListener("click", closeCustomPopup);

  console.log("Executed added cancel button listener", cancelButton);

  function updateGeneratedCaption() {
    let captionText = `#Leetcode daily [${data.date}] - [${
      titleInput.value
    }]\n\n${languageInput.value ? "🔰 " + languageInput.value : ""}\n${
      timeInput.value ? "⏳ " + timeInput.value + " : Time" : ""
    }\n${spaceInput.value ? "📁 " + spaceInput.value + " : Space" : ""}`;
    generatedCaption.value = captionText;
  }

  function closeCustomPopup() {
    console.log("Executed closeCustomPopup function");
  
    popupOpen = false;
  
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
  
      // Remove popup
      popupDiv.remove();
  
      console.log("Executed removed popup");
      
      // Remove event listeners to avoid duplication
      languageInput.removeEventListener("input", updateGeneratedCaption);
      titleInput.removeEventListener("input", updateGeneratedCaption);
      spaceInput.removeEventListener("input", updateGeneratedCaption);
      timeInput.removeEventListener("input", updateGeneratedCaption);
      form.removeEventListener("submit", handleSubmit);
      cancelButton.removeEventListener("click", closeCustomPopup);
      // Remove submit event listener when closing the popup
      submitButton.removeEventListener("click", handleSubmit);
  
      console.log("Executed removed event listeners");
    }
  }
  
  function handleSubmit(event) {
    console.log("Executed submit function");

    event.preventDefault();
    if (!popupOpen) {
      return;
    }

    const input1Value = languageInput.value;
    const input2Value = titleInput.value;
    const input3Value = spaceInput.value;
    const input4Value = timeInput.value;
    const input5Value = document.getElementById("codeTextArea").value;
    const input6Value = generatedCaption.value;

    chrome.runtime.sendMessage({
      action: "processedData",
      data: {
        language: input1Value,
        title: input2Value,
        complexity_space: input3Value,
        complexity_time: input4Value,
        code: input5Value,
        caption: input6Value,
      },
    });

    console.log("Executed send message to background.js");

    closeCustomPopup();
  }
}

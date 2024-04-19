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

function openCustomPopup(data) {
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
        <textarea id="generatedCaption" name="caption" placeholder="Caption...">...</textarea>
        <br><br>
        <button type="submit">Submit</button>
      </form>
    </div>
  `;

  document.body.appendChild(popupDiv);

  var languageInput = document.getElementById("languageInput");
  var titleInput = document.getElementById("titleInput");
  var spaceInput = document.getElementById("spaceInput");
  var timeInput = document.getElementById("timeInput");

  var generatedCaption = document.getElementById("generatedCaption");

  let captionText = `#Leetcode daily [${data.date}] - [${
    titleInput.value
  }]\n\n${
    timeInput.value !== undefined ? "🔰 " + languageInput.value : null
  }\n${
    timeInput.value !== undefined ? "⏳ " + timeInput.value + " : Time" : null
  }\n${
    timeInput.value !== undefined ? "📁 " + spaceInput.value + " : Space" : null
  }`;
  generatedCaption.value = captionText;

  languageInput.addEventListener("input", updateGeneratedCaption);
  titleInput.addEventListener("input", updateGeneratedCaption);
  spaceInput.addEventListener("input", updateGeneratedCaption);
  timeInput.addEventListener("input", updateGeneratedCaption);

  function updateGeneratedCaption() {
    let captionText = `#Leetcode daily [${data.date}] - [${
      titleInput.value
    }]\n\n${
      timeInput.value !== undefined ? "🔰 " + languageInput.value : null
    }\n${
      timeInput.value !== undefined ? "⏳ " + timeInput.value + " : Time" : null
    }\n${
      timeInput.value !== undefined
        ? "📁 " + spaceInput.value + " : Space"
        : null
    }`;
    generatedCaption.value = captionText;
  }

  const form = document.getElementById("customForm");
  form.addEventListener("submit", handleSubmit);

  const cancelButton = document.getElementById("cancelButton");
  cancelButton.addEventListener("click", closeCustomPopup);
}

function handleSubmit(event) {
  event.preventDefault();
  const input1Value = document.getElementById("languageInput").value;
  const input2Value = document.getElementById("titleInput").value;
  const input3Value = document.getElementById("spaceInput").value;
  const input4Value = document.getElementById("timeInput").value;
  const input5Value = document.getElementById("codeTextArea").value;
  const input6Value = document.getElementById("generatedCaption").value;

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

  closeCustomPopup();
}

function closeCustomPopup() {
  const popupDiv = document.getElementById("customPopup");
  if (popupDiv) {
    popupDiv.remove();
  }
}

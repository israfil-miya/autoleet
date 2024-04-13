chrome.runtime.onMessage.addListener((message, _, __) => {
  if (message.action === "openCustomPopup") {
    openCustomPopup(message.data);
  } else if (message.action === "getSelectedText") {
    let selectedText = handleParseSelectedText();
    chrome.runtime.sendMessage({ action: "selectedText", selectedText });
  } else if (message.action === "generateCodeImage") {
    generateCodeImage(message.selectors);
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






const generateCodeImage = (selectors) => {

  const titleSpan = document.querySelector(selectors.title);
  if (titleSpan) {
    titleSpan.innerHTML = ""; // Title left blank for aesthetic but can be any text, preferred: problem name
  } else {
    console.error(`Target not found: ${selectors.title}`);
  }

  const backgroundContainer = document.querySelector(selectors.background);
  if (backgroundContainer) {
    backgroundContainer.style.backgroundImage = `linear-gradient(140deg, rgb(165, 176, 188), rgb(169, 181, 193))`;
  } else {
    console.error(`Target not found: ${selectors.background}`);
  }

  const headerButtons = document.querySelectorAll(selectors.headerButtons);
  if (headerButtons.length) {
    const colors = ["#ff644e", "#ffbf29", "#27ca36"];

    headerButtons.forEach((child, index) => {
      child.style.backgroundColor = colors[index % colors.length];
    });
  } else {
    console.error(`Target not found: ${selectors.background}`);
  }

  const exportButton = document.querySelector(selectors.exportButton);
  if (exportButton) {
    exportButton.click();
  } else {
    console.error(`Target not found: ${selectors.exportButton}`);
  }

  console.log("All Script Executed");
}








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
        <br><br>
        <button type="submit">Submit</button>
      </form>
    </div>
  `;

  document.body.appendChild(popupDiv);

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

  chrome.runtime.sendMessage({
    action: "processedData",
    data: {
      language: input1Value,
      title: input2Value,
      complexity_space: input3Value,
      complexity_time: input4Value,
      code: input5Value,
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

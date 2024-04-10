chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.message === "openConfirmationPopup") {
        console.log(message.data);
        openCustomPopup(message.data)
    }
});


// Function to open the custom popup
function openCustomPopup(data) {
    // Create your custom popup (HTML, CSS, JavaScript)
    const popupDiv = document.createElement("div");
    popupDiv.id = "customPopup";
    popupDiv.innerHTML = `
      <div class="popup-container">
        <h3>Custom Popup</h3>
        <form id="customForm">
          <label for="input1">Parsed Code</label>
          <textarea id="codeTextArea">${data.code}</textarea>
          <br><br>
          <button type="submit">Submit</button>
          <button type="button" id="cancelButton">Cancel</button>
        </form>
      </div>
    `;

    // Append the popup to the body
    document.body.appendChild(popupDiv);

    // Add event listener for form submission
    const form = document.getElementById("customForm");
    form.addEventListener("submit", handleSubmit);

    // Add event listener for cancel button click
    const cancelButton = document.getElementById("cancelButton");
    cancelButton.addEventListener("click", closeCustomPopup);
}

// Function to handle form submission
function handleSubmit(event) {
    event.preventDefault();
    const input1Value = document.getElementById("input1").value;
    const input2Value = document.getElementById("input2").value;

    // Perform actions with form values (send to background script, etc.)
    console.log("Input 1:", input1Value);
    console.log("Input 2:", input2Value);

    // Close the custom popup
    closeCustomPopup();
}

// Function to close the custom popup
function closeCustomPopup() {
    const popupDiv = document.getElementById("customPopup");
    if (popupDiv) {
        popupDiv.remove();
    }
}
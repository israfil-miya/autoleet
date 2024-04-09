chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.message === "myMessage") {
        console.log("recieved message");
        openCustomPopup()
    }
});


// Function to open the custom popup
function openCustomPopup() {
    // Create your custom popup (HTML, CSS, JavaScript)
    const popupDiv = document.createElement("div");
    popupDiv.id = "customPopup";
    popupDiv.innerHTML = `
      <div>
        <h3>Custom Popup</h3>
        <form id="customForm">
          <label for="input1">Input 1:</label>
          <input type="text" id="input1" name="input1">
          <br><br>
          <label for="input2">Input 2:</label>
          <input type="text" id="input2" name="input2">
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
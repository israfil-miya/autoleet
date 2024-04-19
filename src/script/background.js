import detectLang from "./lang-detector";
import { encode } from "./base64";

let ray_so_tabId;
let facebook_tabId;
let data = {};

const facebookAutoPostScript = (query, data, imageBase64) => {
  const imageBlob = base64ToBlob(imageBase64);

  console.log(query, data, imageBlob);

  function clickOnDiv(div) {
    const clickEvent = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    div.dispatchEvent(clickEvent);
  }

  function base64ToBlob(base64String) {
    const [dataType, base64Data] = base64String.split(";base64,");
    const contentType = dataType.split(":")[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  function getPopupOpenerDiv() {
    const spans = document.querySelectorAll("span");

    for (const span of spans) {
      const text = span.textContent.trim();
      if (text.includes("Photo/video")) {
        // Check if the text starts with "Photo/video"
        if (text.indexOf("Photo/video") === 0) {
          // Get the parent div of the parent div of this span
          const parentDiv = span.closest("div");
          if (parentDiv && parentDiv.parentElement) {
            return parentDiv.parentElement;
          }
        }
      }
    }

    return null; // If not found
  }

  function getLexicalEditorCaptionDiv() {
    const elements = document.querySelectorAll(
      'div[contenteditable="true"][role="textbox"][data-lexical-editor="true"]'
    );

    for (const element of elements) {
      const ariaLabel = element.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.includes("What's on your mind")) {
        return element;
      }
    }

    return null; // If not found
  }

  function handleCaptionEditor(lexicalEditor) {
    waitForElm("p", lexicalEditor).then((pTag) => {
      // ensuring the editor is loaded
      const inputEvent = new InputEvent("input", {
        data: data.caption,
        inputType: "insertText",
        dataTransfer: null,
        isComposing: false,
        bubbles: true,
      });
      lexicalEditor.dispatchEvent(inputEvent);

      handleInsertPostImage(imageBlob);
    });
  }

  function handleInsertPostImage(blobImg) {
    // Ensure that blobImg contains valid data
    if (!blobImg) {
      console.error("Invalid blob data");
      return;
    }
    console.log(blobImg);

    // Get the input element
    var inputElement = document.querySelector(
      'input[type="file"][accept="image/*,image/heif,image/heic,video/*,video/mp4,video/x-m4v,video/x-matroska,.mkv"]'
    );
    // Ensure that the input element is found
    if (!inputElement) {
      console.error("Input element not found");
      return;
    }
    console.log("Input element:", inputElement);

    // Create a File object from the Blob
    var file = new File([blobImg], "image.jpg", { type: "image/png" });
    console.log("File:", file);

    // Get the div element that acts as the drop target
    var dropTargetDiv = inputElement.parentElement.querySelector(
      'div[role="button"][tabindex="0"]'
    );
    if (!dropTargetDiv) {
      console.error("Drop target div not found");
      return;
    }

    // Create a new DataTransfer object
    var dataTransfer = new DataTransfer();
    // Add the file to the DataTransfer object
    dataTransfer.items.add(file);

    // Create a drop event
    var dropEvent = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer: dataTransfer,
    });

    // Dispatch the drop event on the drop target div
    dropTargetDiv.dispatchEvent(dropEvent);

    handleClickPostButton();
  }

  function handleClickPostButton() {
    let postButton = document.querySelector(
      'div[aria-label="Post"][role="button"]'
    );

    waitForClickable(postButton, function () {
      clickOnDiv(postButton);
    });
  }

  function waitForClickable(element, callback) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "tabindex"
        ) {
          callback();
          observer.disconnect();
        }
      });
    });

    observer.observe(element, { attributes: true });
  }

  const waitForElm = (selector, parentNode = null, timeout = null) =>
    new Promise((resolve, reject) => {
      if (!selector) reject("no selector");
      if (!parentNode) parentNode = globalThis.document.body;

      const checkNode = (node) => {
        if (node.matches(selector)) {
          resolve(node);
          observer.disconnect();
        }
      };

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const addedNodes = Array.from(mutation.addedNodes);
          addedNodes.forEach((node) => {
            checkNode(node);
            if (node.querySelectorAll) {
              const descendants = Array.from(node.querySelectorAll(selector));
              descendants.forEach((descendant) => {
                checkNode(descendant);
              });
            }
          });
        });
      });

      observer.observe(parentNode, {
        childList: true,
        subtree: true,
      });

      if (timeout) {
        setTimeout(() => {
          observer.disconnect();
          reject("timeout");
        }, timeout);
      }
    });

  // Function to create a MutationObserver
  const observeDOMChanges = (findDesiredElement, callback) => {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };

    const mutationCallback = (mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          const desiredElement = findDesiredElement();
          if (desiredElement) {
            observer.disconnect();
            callback(desiredElement);
            break;
          }
        }
      }
    };

    const observer = new MutationObserver(mutationCallback);
    observer.observe(targetNode, config);

    return observer; // Return the observer in case it needs to be disconnected externally
  };

  // Begins here
  const popupOpenerDiv = getPopupOpenerDiv();
  if (popupOpenerDiv) {
    clickOnDiv(popupOpenerDiv);
    observeDOMChanges(getLexicalEditorCaptionDiv, handleCaptionEditor);
  } else {
    console.error(`"Create Post" Popup opener div not found`);
  }
};

const prepareCodeBlockImageScript = (query, data) => {
  const titleSpan = document.querySelector(query.title);
  if (titleSpan) {
    titleSpan.innerHTML = "";
  } else {
    console.error(`Target not found: ${query.title}`);
  }

  const backgroundContainer = document.querySelector(query.background);
  if (backgroundContainer) {
    backgroundContainer.style.backgroundImage = `linear-gradient(140deg, rgb(165, 176, 188), rgb(169, 181, 193))`;
  } else {
    console.error(`Target not found: ${query.background}`);
  }

  const headerButtons = document.querySelectorAll(query.headerButtons);
  if (headerButtons.length) {
    const colors = ["#ff644e", "#ffbf29", "#27ca36"];
    headerButtons.forEach((child, index) => {
      child.style.backgroundColor = colors[index % colors.length];
    });
  } else {
    console.error(`Target not found: ${query.background}`);
  }

  const exportButton = document.querySelector(query.exportButton);
  if (exportButton) {
    exportButton.click();
  } else {
    console.error(`Target not found: ${query.exportButton}`);
  }
};

async function executeScriptOnTabLoad(tabId, script, ...args) {
  return new Promise((resolve, reject) => {
    const tabUpdated = new Promise((innerResolve) => {
      chrome.tabs.onUpdated.addListener(function listener(
        updatedTabId,
        changeInfo
      ) {
        if (updatedTabId === tabId && changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          innerResolve();
        }
      });
    });

    tabUpdated.then(async () => {
      try {
        // Convert blob to data URL using FileReader
        const argsWithBlobConverted = await Promise.all(
          args.map(async (arg) => {
            if (arg instanceof Blob) {
              return new Promise((resolveReader, rejectReader) => {
                const reader = new FileReader();
                reader.onload = function () {
                  resolveReader(reader.result);
                };
                reader.onerror = function (error) {
                  rejectReader(error);
                };
                reader.readAsDataURL(arg);
              });
            }
            return arg;
          })
        );

        console.log("Args", argsWithBlobConverted);

        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: script,
          args: argsWithBlobConverted,
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

function openRaySoTab(data, encodedCode) {
  return new Promise((resolve, reject) => {
    let openTabUrl = "https://ray.so/#code=" + encodedCode;
    chrome.tabs.create({ url: openTabUrl, active: false }, (tab) => {
      if (tab) {
        ray_so_tabId = tab.id;
        resolve(tab.id);
      } else {
        reject(new Error("Failed to create a new tab for ray.so"));
      }
    });
  });
}

function downloadCodeImage(data, encodedCode) {
  return new Promise(async (resolve, reject) => {
    try {
      if (ray_so_tabId) {
        chrome.tabs.remove(ray_so_tabId);
        ray_so_tabId = undefined;
      }

      let newTabId = await openRaySoTab(data, encodedCode);

      let selectors = {
        title: 'div.Frame_fileName__zfOJA span[data-ignore-in-export="true"]',
        background: "div.Frame_frame__CAiHj",
        headerButtons: "div.Frame_controls__xPHKk div.Frame_control__WM3BS",
        exportButton: "button.ExportButton_button__MA4PI",
      };

      await executeScriptOnTabLoad(
        newTabId,
        prepareCodeBlockImageScript,
        selectors,
        data
      );
      resolve(newTabId);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

function formatText(text) {
  const words = (text + " ")
    .replace(/[-_]+|\B\b/g, " ")
    .trim()
    .split(/\s+/);

  const titleCasedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

  const formattedText = titleCasedWords.join(" ");

  const linkRegex = /\[([^\])]+)]\(([^)]+)\)/g;
  const linkMatches = formattedText.matchAll(linkRegex);

  let result = formattedText;
  for (const match of linkMatches) {
    const linkText = match[1];
    const url = decodeURIComponent(match[2]);

    result =
      result.slice(0, match.index) +
      ` [${linkText}](${url}) ` +
      result.slice(match.index + match[0].length);
  }

  return result.trim();
}

function getTodaysDate() {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();

  const ordinal = ((day) => {
    const ones = day % 10;
    const tens = Math.floor(day / 10);
    if (tens === 1) {
      return "th";
    } else {
      switch (ones) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    }
  })(day);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthName = monthNames[month];

  const formattedDate = `${day}${ordinal} ${monthName} ${year}`;
  return formattedDate;
}

const handleSelectedText = (message, info, tab) => {
  let parsed_code = message.selectedText;

  let title_end_index = info.pageUrl.indexOf("/", 31);
  let title_start_index = info.pageUrl.indexOf("/", 25);

  let problem_name = formatText(
    info.pageUrl.substring(title_start_index + 1, title_end_index)
  );

  let detected_language = detectLang(parsed_code);

  chrome.tabs.sendMessage(tab.id, {
    action: "openCustomPopup",
    data: {
      language: detected_language,
      problem_name,
      code: parsed_code,
      date: getTodaysDate(),
    },
  });
};

const handleProcessedData = async (message, info, tab) => {
  data = message.data;
  await downloadCodeImage(data, encode(data.code));
};

chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    title: "Share to social media",
    contexts: ["selection"],
    id: "share_menu_item",
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "share_menu_item") {
    chrome.tabs.sendMessage(tab.id, { action: "getSelectedText" });

    chrome.runtime.onMessage.addListener(async function onMessage(
      message,
      _,
      __
    ) {
      if (message.action === "selectedText") {
        handleSelectedText(message, info, tab);
      } else if (message.action === "processedData") {
        chrome.runtime.onMessage.removeListener(onMessage);
        await handleProcessedData(message, info, tab);
      }
    });
  }
});

function getLatestDownloadedFile() {
  return new Promise((resolve, reject) => {
    chrome.downloads.search(
      {
        filenameRegex: "ray-so-export(?:\\s*\\(\\d+\\))?\\.png",
        orderBy: ["-startTime"],
        limit: 1,
      },
      function (downloadItems) {
        if (downloadItems && downloadItems.length > 0) {
          const latestDownload = downloadItems[0];
          resolve(latestDownload);
        } else {
          reject(new Error("No matching files found"));
        }
      }
    );
  });
}

async function readLatestDownloadedFile() {
  try {
    const latestDownload = await getLatestDownloadedFile();
    const fileURL = "file://" + latestDownload.filename;

    // Fetch the file content using the Fetch API
    const response = await fetch(fileURL);
    if (response.ok) {
      const blobData = await response.blob();
      console.log(blobData);
      return blobData;
    } else {
      console.error("Fetch Error:", response.statusText);
    }
  } catch (error) {
    console.error("Error reading latest downloaded file:", error);
  }
}

chrome.downloads.onChanged.addListener(async function onDownloadChanged(
  downloadDelta
) {
  if (downloadDelta.state && downloadDelta.state.current === "complete") {
    if (ray_so_tabId) {
      chrome.tabs.remove(ray_so_tabId);
      ray_so_tabId = undefined;
    }

    let imageBlob = await readLatestDownloadedFile();
    console.log("Image Blob:", imageBlob);
    console.log("Code Data:", data);

    await uploadToFacebook(data, imageBlob);

    // Handle the image blob as needed
  }
});

async function uploadToFacebook(data, imageBlob) {
  return new Promise(async (resolve, reject) => {
    try {
      let tabId = await openFacebookTab();

      console.log("Facebook Tab ID: ", tabId);

      let selectors = {
        postBar: 'div[role="button"][tabindex="0"] > div:has(span)',
      };

      // Activate the tab temporarily
      await chrome.tabs.update(tabId, { active: true });

      // Perform actions on the tab
      await executeScriptOnTabLoad(
        tabId,
        facebookAutoPostScript,
        selectors,
        data,
        imageBlob
      );

      // Deactivate the tab again
      await chrome.tabs.update(tabId, { active: false });

      resolve(tabId);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}

function openFacebookTab() {
  function createNewFacebookTab(resolve, reject) {
    chrome.tabs.create(
      { url: "https://facebook.com", active: false },
      (tab) => {
        if (tab) {
          facebook_tabId = tab.id; // Store the new tab ID
          resolve(tab.id);
        } else {
          reject(new Error("Failed to create a new Facebook tab"));
        }
      }
    );
  }

  return new Promise((resolve, reject) => {
    // Check if the Facebook tab is already open
    if (facebook_tabId) {
      chrome.tabs.get(facebook_tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          // If tab is not found, create a new one
          createNewFacebookTab(resolve, reject);
        } else {
          // If tab is found, reuse it
          chrome.tabs.update(facebook_tabId, { url: "https://facebook.com" });
          resolve(facebook_tabId);
        }
      });
    } else {
      // If tab ID is not set, create a new tab
      createNewFacebookTab(resolve, reject);
    }
  });
}

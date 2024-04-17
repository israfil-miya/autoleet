import detectLang from "./lang-detector";
import { encode } from "./base64";

let ray_so_tabId;
let facebook_tabId;
let data = {};

const facebookAutoPostScript = (query, data, imageBlob) => {
  function clickOnDiv(div) {
    const clickEvent = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    div.dispatchEvent(clickEvent);
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
        data: "Hello, world!",
        inputType: "insertText",
        dataTransfer: null,
        isComposing: false,
        bubbles: true,
      });
      lexicalEditor.dispatchEvent(inputEvent);
    });
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

  // Usage example
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
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: script,
          args: args,
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
    },
  });
};

const handleProcessedData = async (message, info, tab) => {
  data = { ...message.data, date: getTodaysDate() };

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

function uploadToFacebook(data, imageBlob) {
  return new Promise(async (resolve, reject) => {
    try {
      let tabId = await openFacebookTab();

      console.log("facebook Tab ID: ", tabId);

      let selectors = {
        postBar: 'div[role="button"][tabindex="0"] > div:has(span)',
      };

      await executeScriptOnTabLoad(
        tabId,
        facebookAutoPostScript,
        selectors,
        data,
        imageBlob
      );
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
          resolve(facebook_tabId);
        }
      });
    } else {
      // If tab ID is not set, create a new tab
      createNewFacebookTab(resolve, reject);
    }
  });
}

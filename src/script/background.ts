import detectLang from "./lang-detector";
import { encode } from "./base64";
import moment from "moment-timezone";

/*
Set this to true if the professional mode is enabled
in the Facebook account/profile; otherwise, set it to false.
*/
const professionalAccount: Boolean = true;

/*
Set this to true if you want to require confirmation before
posting the content; otherwise, set it to false.
*/
const requireConfirmationBeforePosting: Boolean = true;

/*
Set the countdown time in seconds before the content is posted
to Facebook after the confirmation is received.
*/
const countdownAfterConfirmationInSeconds: number = 5;

interface Message {
  action: string;
  info?: chrome.contextMenus.OnClickData;
  tab?: chrome.tabs.Tab;
  selectedText?: string;
  problemName?: string;
  data?: ProcessedData;
}

interface ProcessedData {
  language: string;
  title: string;
  complexity_space: string;
  complexity_time: string;
  github_link: string;
  code: string;
  caption: string;
}

interface FacebookSelectors {
  postBar: string;
}

interface RaySoCodeBlockSelectors {
  title: string;
  background: string;
  headerButtons: string;
  exportButton: string;
}

let raySoTabId: undefined | number;
let facebookTabId: undefined | number;
let data: ProcessedData;

const facebookSelectors: FacebookSelectors = {
  postBar: 'div[role="button"][tabindex="0"] > div:has(span)',
};

const raySoCodeBlockSelectors: RaySoCodeBlockSelectors = {
  title: 'div.Frame_fileName__ridJz span[data-ignore-in-export="true"]',
  background: "div.Frame_frame__rcr69",
  headerButtons: "div.Frame_controls__hvQWe div.Frame_control__8KxPF",
  exportButton: 'span.buttonGroup button[aria-label="Export as PNG"]',
};

function facebookAutoPostScript(
  query: FacebookSelectors,
  data: ProcessedData,
  imageBase64: string,
  professionalAccount: Boolean,
  countdownInSeconds: number,
  requireConfirmationBeforePosting: Boolean
): void {
  const imageBlob = base64ToBlob(imageBase64);

  function getPopupOpenerDiv(): HTMLElement | null {
    const spans = document.querySelectorAll("span");

    for (const span of Array.from(spans)) {
      const text = span.textContent?.trim();
      if (text && text.includes("Photo/video")) {
        if (text.indexOf("Photo/video") === 0) {
          const parentDiv = span.closest("div");
          if (parentDiv && parentDiv.parentElement) {
            return parentDiv.parentElement as HTMLElement;
          }
        }
      }
    }

    return null;
  }

  function getLexicalEditorCaptionDiv(): HTMLElement | null {
    const elements = document.querySelectorAll(
      'div[contenteditable="true"][role="textbox"][data-lexical-editor="true"]'
    );

    for (const element of Array.from(elements)) {
      const ariaLabel = element.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.includes("What's on your mind")) {
        return element as HTMLElement;
      }
    }

    return null;
  }

  function handleCaptionEditor(lexicalEditor: HTMLElement): void {
    waitForElm("p", lexicalEditor).then((pTag) => {
      const inputEvent = new InputEvent("input", {
        data: data.caption,
        inputType: "insertText",
        dataTransfer: null,
        isComposing: false,
        bubbles: true,
      });
      lexicalEditor.dispatchEvent(inputEvent);

      // Manually set the text
      lexicalEditor.innerHTML = `<p>${data.caption}</p>`;

      handleInsertPostImage(imageBlob);
    });
  }

  function handleInsertPostImage(blobImg: Blob): void {
    if (!blobImg) {
      console.error("Invalid blob data");
      return;
    }
    console.log(blobImg);

    const inputElement = document.querySelector(
      'input[type="file"][accept="image/*,image/heif,image/heic,video/*,video/mp4,video/x-m4v,video/x-matroska,.mkv"]'
    ) as HTMLInputElement;

    if (!inputElement) {
      console.error("Input element not found");
      return;
    }
    console.log("Input element:", inputElement);

    const file = new File([blobImg], "image.jpg", { type: "image/png" });
    console.log("File:", file);

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputElement.files = dataTransfer.files;

    const changeEvent = new Event("change", {
      bubbles: true,
    });
    inputElement.dispatchEvent(changeEvent);

    if (professionalAccount) {
      handleClickNextButton();
    } else {
      handleClickPostButton();
    }
  }

  function handleClickPostButton(): void {
    const postButton = document.querySelector(
      'div[aria-label="Post"][role="button"]'
    ) as HTMLElement;

    if (!postButton) {
      console.error("Post button not found");
      return;
    }


    console.log("Post button found, waiting for it to be clickable");

    waitForClickable(postButton, () => {
      const handlePost = () => {
        // Countdown logic
        let countdown = countdownInSeconds;
        const intervalId = setInterval(() => {
          if (countdown <= 0) {
            clearInterval(intervalId);
            clickOnDiv(postButton);
          } else {
            countdown--;
          }
        }, 1000);
      };
    
      if (requireConfirmationBeforePosting) {
        // Prompt user for confirmation
        const userConfirmed = confirm(
          `Click "OK" to post in ${countdownInSeconds} seconds, or click "Cancel" to abort.`
        );
    
        if (!userConfirmed) {
          console.log("User cancelled the post");
          location.reload();
          return; // Exit if user cancels
        }
    
        console.log("User confirmed the post");
      }
    
      handlePost(); // Proceed with countdown and clicking the button
    });

  }

  // for professional account
  function handleClickNextButton(): void {
    const nextButton = document.querySelector(
      'div[aria-label="Next"][role="button"]'
    ) as HTMLElement;

    if (!nextButton) {
      console.error("Next button not found");
      return;
    }

    console.log("Next button found, waiting for it to be clickable");

    waitForClickable(nextButton, () => {
      console.log("Next button is clickable, clicking it now");
      clickOnDiv(nextButton);
    });

    // observe for next page load (observe dom changes) and then click on post button
    observeDOMChanges(() => {
      const postButton = document.querySelector(
        'div[aria-label="Post"][role="button"]'
      );
      if (postButton) {
        console.log("Post button detected by observer");
      }
      return postButton as HTMLElement;
    }, handleClickPostButton);
  }

  function waitForClickable(element: HTMLElement, callback: () => void): void {
    // Function to check if the element is clickable
    const isClickable = (): boolean => {
      const tabindex = element.getAttribute("tabindex");
      return tabindex !== null && parseInt(tabindex) >= 0;
    };

    // Function to handle the callback when the element becomes clickable
    const handleCallback = () => {
      if (isClickable()) {
        console.log("Element is clickable:", element);
        callback();
        observer.disconnect();
      } else {
        console.error("Element is not clickable yet:", element);
      }
    };

    // MutationObserver to watch for changes in the element's attributes
    const observer = new MutationObserver(() => {
      handleCallback();
    });

    observer.observe(element, { attributes: true });

    // Initial check
    handleCallback();

    // Fallback check after 5 seconds
    setTimeout(() => {
      handleCallback();
    }, 5000);

    console.log("Observer set to wait for element to be clickable:", element);
  }

  function observeDOMChanges(
    findDesiredElement: () => HTMLElement | null,
    callback: (element: HTMLElement) => void
  ): MutationObserver {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };

    const mutationCallback: MutationCallback = (mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          const desiredElement = findDesiredElement();
          if (desiredElement) {
            console.log("Desired element found:", desiredElement);
            observer.disconnect();
            callback(desiredElement);
            break;
          }
        }
      }
    };

    const observer = new MutationObserver(mutationCallback);
    observer.observe(targetNode, config);

    return observer;
  }

  function clickOnDiv(div: HTMLElement): void {
    const clickEvent = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    div.dispatchEvent(clickEvent);
  }

  function waitForElm(
    selector: string,
    parentNode: HTMLElement | null = null,
    timeout: number | null = null
  ): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      if (!selector) reject("No selector provided");
      if (!parentNode) parentNode = document.body;

      const checkNode = (node: HTMLElement) => {
        if (node.matches(selector)) {
          resolve(node);
          observer.disconnect();
        }
      };

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const addedNodes = Array.from(mutation.addedNodes);
          addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              checkNode(node);
              const descendants = Array.from(node.querySelectorAll(selector));
              descendants.forEach((descendant) => {
                if (descendant instanceof HTMLElement) {
                  checkNode(descendant);
                }
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
          reject("Timeout waiting for element");
        }, timeout);
      }
    });
  }

  function base64ToBlob(base64String: string): Blob {
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

  const popupOpenerDiv = getPopupOpenerDiv();

  if (popupOpenerDiv) {
    clickOnDiv(popupOpenerDiv);
    observeDOMChanges(getLexicalEditorCaptionDiv, handleCaptionEditor);
  } else {
    console.error(`"Create Post" Popup opener div not found`);
  }
}

const prepareCodeBlockImageScript = (
  query: RaySoCodeBlockSelectors,
  data: ProcessedData
) => {
  const titleSpan = document.querySelector(query.title) as HTMLSpanElement;
  if (titleSpan) {
    titleSpan.innerHTML = "";
  } else {
    console.error(`Target not found: ${query.title}`);
  }

  const backgroundContainer = document.querySelector(
    query.background
  ) as HTMLDivElement;
  if (backgroundContainer) {
    backgroundContainer.style.backgroundImage = `linear-gradient(140deg, rgb(165, 176, 188), rgb(169, 181, 193))`;
  } else {
    console.error(`Target not found: ${query.background}`);
  }

  const headerButtons = document.querySelectorAll(
    query.headerButtons
  ) as NodeListOf<HTMLElement>;
  if (headerButtons.length) {
    const colors = ["#ff644e", "#ffbf29", "#27ca36"];
    headerButtons.forEach((child, index) => {
      child.style.backgroundColor = colors[index % colors.length];
    });
  } else {
    console.error(`Target not found: ${query.background}`);
  }

  const exportButton = document.querySelector(
    query.exportButton
  ) as HTMLElement;
  if (exportButton) {
    exportButton.click();
  } else {
    console.error(`Target not found: ${query.exportButton}`);
  }
};

async function executeScriptOnTabLoad(
  tabId: number,
  script: (...args: any[]) => void,
  ...args: any[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tabUpdated = new Promise<void>((innerResolve) => {
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
        const argsWithBlobConverted = await Promise.all(
          args.map(async (arg) => {
            if (arg instanceof Blob) {
              return new Promise<string | ArrayBuffer | null>(
                (resolveReader, rejectReader) => {
                  const reader = new FileReader();
                  reader.onload = function () {
                    resolveReader(reader.result);
                  };
                  reader.onerror = function (error) {
                    rejectReader(error);
                  };
                  reader.readAsDataURL(arg);
                }
              );
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

const openRaySoTab = (
  data: ProcessedData,
  encodedCode: string
): Promise<number> => {
  return new Promise((resolve, reject) => {
    const openTabUrl = `https://ray.so/#code=${encodedCode}`;
    chrome.tabs.create({ url: openTabUrl, active: false }, (tab) => {
      if (tab && tab.id !== undefined) {
        raySoTabId = tab.id;
        resolve(tab.id);
      } else {
        reject(new Error("Failed to create a new tab for ray.so"));
      }
    });
  });
};

const downloadCodeImage = (
  data: ProcessedData,
  encodedCode: string
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (raySoTabId !== undefined) {
        chrome.tabs.remove(raySoTabId);
        raySoTabId = undefined;
      }

      const newTabId = await openRaySoTab(data, encodedCode);

      const selectors: RaySoCodeBlockSelectors = raySoCodeBlockSelectors;

      await executeScriptOnTabLoad(
        newTabId,
        prepareCodeBlockImageScript,
        selectors,
        data
      );
      resolve();
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    title: "Share to social media",
    contexts: ["selection"],
    id: "share_menu_item",
  });
});

function getTodaysDate(): string {
  const today = moment();
  const day = today.format("Do");
  const month = today.format("MMM");
  const year = today.format("YY");

  return `${day} ${month}'${year}`;
}

const handleSelectedText = (message: Message): void => {
  if (!message.tab || !message.selectedText || !message.problemName) return;

  const { tab, selectedText, problemName } = message;

  const parsed_code = selectedText;

  const problem_name = problemName;

  const detected_language = detectLang(parsed_code);

  chrome.tabs.sendMessage(tab.id!, {
    action: "openCustomPopup",
    data: {
      language: detected_language,
      problem_name,
      code: parsed_code,
      date: getTodaysDate(),
    },
  });

  console.log("Sent the message to open the popup");
};

const handleProcessedData = async (message: Message): Promise<void> => {
  if (!message.data) return;

  data = message.data;
  await downloadCodeImage(data, encode(data.code));
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    // Remove all existing items before creating a new one
    chrome.contextMenus.create({
      title: "Share to social media",
      contexts: ["selection"],
      id: "share_menu_item",
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab) return;

  if (info.menuItemId === "share_menu_item") {
    chrome.tabs.sendMessage(tab.id!, {
      action: "getSelectedText",
      info,
      tab,
    });
  }
});

// Message listener function
chrome.runtime.onMessage.addListener(
  async (message: Message, _, __): Promise<void> => {
    if (message.action === "selectedText") {
      handleSelectedText(message);
    } else if (message.action === "processedData") {
      await handleProcessedData(message);
    }
  }
);

function getLatestDownloadedFile(): Promise<chrome.downloads.DownloadItem | null> {
  return new Promise((resolve, reject) => {
    chrome.downloads.search(
      {
        orderBy: ["-startTime"],
        limit: 1,
      },
      function (downloadItems) {
        if (downloadItems && downloadItems.length > 0) {
          const latestDownload = downloadItems[0];
          const filename = latestDownload.filename;
          const regex = /ray-so-export(?:\s*\(\d+\))?\.png$/;

          if (regex.test(filename)) {
            resolve(latestDownload);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      }
    );
  });
}

async function readLatestDownloadedFile(): Promise<Blob | null> {
  try {
    const latestDownload = await getLatestDownloadedFile();
    if (!latestDownload) return null;

    const fileURL = "file://" + latestDownload.filename;

    // Fetch the file content using the Fetch API
    const response = await fetch(fileURL);
    if (response.ok) {
      const blobData = await response.blob();
      console.log(blobData);
      return blobData;
    } else {
      // console.log("Fetch Error:", response.statusText);
      return null;
    }
  } catch (error) {
    // console.log("Error reading latest downloaded file:", error);
    return null;
  }
}

chrome.downloads.onChanged.addListener(async function onDownloadChanged(
  downloadDelta: chrome.downloads.DownloadDelta
) {
  if (downloadDelta.state && downloadDelta.state.current === "complete") {
    if (raySoTabId) {
      chrome.tabs.remove(raySoTabId);
      raySoTabId = undefined;
    }

    let imageBlob: Blob | null = await readLatestDownloadedFile();

    console.log("Image Blob:", imageBlob);
    console.log("Code Data:", data);

    if (!imageBlob) return;

    console.log("Triggering upload to Facebook");

    await uploadToFacebook(data, imageBlob);

    // Handle the image blob as needed
  }
});

const openFacebookTab = (): Promise<number | null> => {
  const createNewFacebookTab = (
    resolve: (value: number | null) => void,
    reject: (reason?: any) => void
  ): void => {
    chrome.tabs.create(
      { url: "https://facebook.com", active: false },
      (tab) => {
        if (tab && tab.id !== undefined) {
          facebookTabId = tab.id; // Store the new tab ID
          resolve(tab.id);
        } else {
          reject(new Error("Failed to create a new Facebook tab"));
        }
      }
    );
  };

  return new Promise((resolve, reject) => {
    // Check if the Facebook tab is already open
    if (facebookTabId !== undefined) {
      chrome.tabs.get(facebookTabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          // If tab is not found, create a new one
          createNewFacebookTab(resolve, reject);
        } else {
          // If tab is found, reuse it
          chrome.tabs.update(
            facebookTabId!,
            { url: "https://facebook.com" },
            () => {
              resolve(facebookTabId!);
            }
          );
        }
      });
    } else {
      // If tab ID is not set, create a new tab
      createNewFacebookTab(resolve, reject);
    }
  });
};

const uploadToFacebook = async (
  data: ProcessedData,
  imageBlob: Blob
): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    try {
      let tabId: number | null = await openFacebookTab();

      if (tabId === null) {
        return reject(new Error("Failed to open Facebook tab"));
      }

      console.log("Facebook Tab ID: ", tabId);

      let selectors: FacebookSelectors = facebookSelectors;

      // Activate the tab temporarily
      chrome.tabs.update(tabId, { active: true });

      // Perform actions on the tab
      await executeScriptOnTabLoad(
        tabId,
        facebookAutoPostScript,
        selectors,
        data,
        imageBlob,
        professionalAccount,
        countdownAfterConfirmationInSeconds,
        requireConfirmationBeforePosting
      );

      // Deactivate the tab again
      await chrome.tabs.update(tabId, { active: false });

      resolve(tabId);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });

  /* This is the end of execution of the script */
};

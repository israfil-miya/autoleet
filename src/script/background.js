import detectLang from "./lang-detector";
import { encode } from "./base64";

let ray_so_tabId;

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
  let data = { ...message.data, date: getTodaysDate() };

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



    
    // Handle the image blob as needed



  }
});

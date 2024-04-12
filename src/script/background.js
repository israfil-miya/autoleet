import jsBeautify from "js-beautify";
import detectLang from "./lang-detector";
import { encode } from "./base64";

async function injectHtmlCode(targetHtmlQuery, targetTabId, data) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: targetTabId },

      func: (query, info) => {
        console.log(query, info);

        const titleSpan = document.querySelector(query.title);
        if (titleSpan) {
          titleSpan.innerHTML = ""; // Title left blank for aesthetic but can be any text, preferred: problem name
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

        console.log("All Script Executed");
      },
      args: [targetHtmlQuery, data], // Pass query and code as arguments
    });
  } catch (error) {
    console.error("Error injecting code:", error);
  }
}

function generateCodeImage(data, encodedCode) {
  return new Promise(async (resolve, reject) => {
    let openTabUrl = "https://ray.so/#code=" + encodedCode;
    let targetTabId = (
      await chrome.tabs.create({ url: openTabUrl, active: false })
    ).id;

    if (targetTabId) {
      await injectHtmlCode(
        {
          title: 'div.Frame_fileName__zfOJA span[data-ignore-in-export="true"]',
          background: "div.Frame_frame__CAiHj",
          headerButtons: "div.Frame_controls__xPHKk div.Frame_control__WM3BS",
          exportButton: "button.ExportButton_button__MA4PI",
        },
        targetTabId,
        data
      );

      resolve(targetTabId);
    } else {
      reject(new Error("Failed to obtain a valid tab ID for script injection"));
    }
  });
}

function formatText(text) {
  // 1. Split into words at dashes and camel case, handling empty strings at the beginning
  const words = (text + " ") // Add a trailing space to handle leading dashes
    .replace(/[-_]+|\B\b/g, " ") // Replace dashes and camel case breaks with spaces
    .trim() // Remove leading/trailing spaces
    .split(/\s+/); // Split on one or more whitespace characters

  // 2. Title case each word
  const titleCasedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

  // 3. Reconstruct the text with title-cased words
  const formattedText = titleCasedWords.join(" ");

  // 4. Handle links (same as before)
  const linkRegex = /\[([^\])]+)]\(([^)]+)\)/g; // Escape closing parenthesis
  const linkMatches = formattedText.matchAll(linkRegex);

  let result = formattedText;
  let lastIndex = 0;
  for (const match of linkMatches) {
    const linkText = match[1]; // Group 1 captures link text
    const url = decodeURIComponent(match[2]); // Decode URL for better handling

    result =
      result.slice(0, match.index) +
      ` [${linkText}](${url}) ` +
      result.slice(match.index + match[0].length);
    lastIndex = match.index + ` [${linkText}](${url}) `.length;
  }

  return result.trim(); // Remove leading/trailing spaces
}

function getTodaysDate() {
  const today = new Date();

  const day = today.getDate();
  const month = today.getMonth(); // Get the month (0-indexed)
  const year = today.getFullYear();

  // Format the day with ordinal indicator (st, nd, rd, th)
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

  // Format the month name (March, April, etc.)
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

  // Combine formatted day, month, and year with spaces
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

  console.log(data);

  let ray_so_tabId = await generateCodeImage(data, encode(data.code));

  console.log(ray_so_tabId);
};

chrome.contextMenus.create({
  title: "Share to social media",
  contexts: ["selection"],
  id: "share_menu_item",
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // console.log(info, tab);

  if (info.menuItemId === "share_menu_item") {
    chrome.tabs.sendMessage(tab.id, { action: "getSelectedText" });

    chrome.runtime.onMessage.addListener(async (message, _, __) => {
      if (message.action === "selectedText") {
        handleSelectedText(message, info, tab);
      } else if (message.action === "processedData") {
        await handleProcessedData(message, info, tab);
      }
    });
  }
});

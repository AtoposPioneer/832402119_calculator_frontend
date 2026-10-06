const API_BASE_URL = "https://eight32402119-calculator-backend.onrender.com";

const expressionInput = document.querySelector("#expressionInput");
const resultOutput = document.querySelector("#resultOutput");
const messageOutput = document.querySelector("#messageOutput");
const historyList = document.querySelector("#historyList");
const themeToggle = document.querySelector("#themeToggle");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const keypad = document.querySelector(".keypad");
const backendStatus = document.querySelector("#backendStatus");

function setMessage(text, isError = false) {
  messageOutput.textContent = text;
  messageOutput.classList.toggle("error", isError);
}

function appendToExpression(value) {
  const start = expressionInput.selectionStart;
  const end = expressionInput.selectionEnd;
  const current = expressionInput.value;
  expressionInput.value = `${current.slice(0, start)}${value}${current.slice(end)}`;
  expressionInput.focus();
  expressionInput.setSelectionRange(start + value.length, start + value.length);
}

function backspaceExpression() {
  const start = expressionInput.selectionStart;
  const end = expressionInput.selectionEnd;
  const current = expressionInput.value;

  if (start !== end) {
    expressionInput.value = `${current.slice(0, start)}${current.slice(end)}`;
    expressionInput.setSelectionRange(start, start);
    return;
  }

  if (start > 0) {
    expressionInput.value = `${current.slice(0, start - 1)}${current.slice(start)}`;
    expressionInput.setSelectionRange(start - 1, start - 1);
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.detail || "Request failed.";
    throw new Error(message);
  }

  return data;
}

async function calculate() {
  const expression = expressionInput.value.trim();

  if (!expression) {
    setMessage("Please enter an expression.", true);
    return;
  }

  setMessage("Calculating...");

  try {
    const data = await requestJson(`${API_BASE_URL}/api/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expression }),
    });

    resultOutput.textContent = data.result;
    setMessage("Sent to backend and saved.");
    await loadHistory();
  } catch (error) {
    resultOutput.textContent = "No result";
    setMessage(error.message, true);
  }
}

async function loadHistory() {
  try {
    const items = await requestJson(`${API_BASE_URL}/api/history`);
    setBackendStatus(true);
    renderHistory(items);
  } catch (error) {
    setBackendStatus(false);
    renderHistory([]);
    setMessage("Cannot connect to the backend service.", true);
  }
}

function setBackendStatus(isOnline) {
  backendStatus.textContent = isOnline ? "Backend online" : "Backend offline";
  backendStatus.classList.toggle("offline", !isOnline);
}

function renderHistory(items) {
  historyList.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "No calculation history yet.";
    historyList.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const content = document.createElement("div");

    const expression = document.createElement("p");
    expression.className = "history-expression";
    expression.textContent = item.expression;

    const result = document.createElement("p");
    result.className = "history-result";
    result.textContent = `= ${item.result}`;

    const time = document.createElement("p");
    time.className = "history-time";
    time.textContent = item.created_at;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.title = "Delete history record";
    deleteButton.setAttribute("aria-label", "Delete history record");
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => deleteHistory(item.id));

    content.append(expression, result, time);
    li.append(content, deleteButton);
    historyList.appendChild(li);
  });
}

async function deleteHistory(id) {
  try {
    await requestJson(`${API_BASE_URL}/api/history/${id}`, {
      method: "DELETE",
    });
    setMessage("History record deleted.");
    await loadHistory();
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function clearHistory() {
  try {
    await requestJson(`${API_BASE_URL}/api/history`, {
      method: "DELETE",
    });
    resultOutput.textContent = "Waiting for input";
    setMessage("History cleared.");
    await loadHistory();
  } catch (error) {
    setMessage(error.message, true);
  }
}

function handleKeypadClick(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const value = button.dataset.value;
  const action = button.dataset.action;

  if (value) {
    appendToExpression(value);
    return;
  }

  if (action === "clear") {
    expressionInput.value = "";
    resultOutput.textContent = "Waiting for input";
    setMessage("");
  }

  if (action === "backspace") {
    backspaceExpression();
  }

  if (action === "calculate") {
    calculate();
  }
}

function handleKeyboard(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    calculate();
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark");
}

keypad.addEventListener("click", handleKeypadClick);
expressionInput.addEventListener("keydown", handleKeyboard);
themeToggle.addEventListener("click", toggleTheme);
clearHistoryButton.addEventListener("click", clearHistory);

loadHistory();

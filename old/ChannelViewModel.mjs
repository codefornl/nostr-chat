// ChannelViewModel.mjs
import { createNostrClient } from './Nostr.mjs';

export function createChannelViewModel(channel, onMessage) {
  const container = document.createElement("div");
  container.id = "channel-" + channel.id;
  container.className = "channel-container";
  container.style.display = "none";

  const messagesDiv = document.createElement("div");
  messagesDiv.className = "channel-messages";
  container.appendChild(messagesDiv);

  const inputDiv = document.createElement("div");
  inputDiv.className = "channel-input";

  const inputField = document.createElement("input");
  inputField.type = "text";
  inputField.placeholder = "Schrijf je bericht...";
  inputField.className = "channel-text-input";
  inputDiv.appendChild(inputField);

  const sendButton = document.createElement("button");
  sendButton.textContent = "POST";
  sendButton.className = "channel-send-button";
  inputDiv.appendChild(sendButton);

  container.appendChild(inputDiv);

  const nostr = createNostrClient(channel, (event) => {
    addMessage(event);
    onMessage(channel.id, event);
  });

  sendButton.onclick = send;
  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") send();
  });

  function send() {
    const content = inputField.value;
    if (content) {
      nostr.sendMessage(content);
      inputField.value = "";
    }
  }

  function show() {
    container.style.display = "block";
  }

  function hide() {
    container.style.display = "none";
  }

  function addMessage(event) {
    const msg = document.createElement("div");
    msg.className = "message";
    msg.textContent = event.content;
    messagesDiv.appendChild(msg);
  }

  return {
    id: channel.id,
    label: channel.label,
    tag: channel.tag,
    show,
    hide,
    addMessage,
    getElement: () => container,
    nostr,
  };
}
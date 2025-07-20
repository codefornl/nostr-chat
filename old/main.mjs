// main.mjs
import { createChannelViewModel } from './ChannelViewModel.mjs';

const channelsDiv = document.getElementById("channels");
const messagesWrapper = document.getElementById("messages-wrapper");
const channelNameSpan = document.getElementById("channelName");

let channelViews = {};
let activeChannelId = null;

fetch("channels.json")
  .then((res) => res.json())
  .then((channels) => {
    channels.forEach((channel) => {
      const viewModel = createChannelViewModel(channel, handleNewMessage);
      channelViews[channel.id] = viewModel;
      messagesWrapper.appendChild(viewModel.getElement());

      const btn = document.createElement("button");
      btn.textContent = "#" + channel.label;
      btn.className = "channel-button";
      btn.onclick = () => switchChannel(channel.id);
      channelsDiv.appendChild(btn);
    });

    if (channels.length > 0) {
      switchChannel(channels[0].id);
    }
  })
  .catch((err) => {
    console.error("Failed to load channels.json", err);
  });

function switchChannel(channelId) {
  if (activeChannelId === channelId) return; // FIXME close menu in mobile view
  if (activeChannelId && channelViews[activeChannelId]) {
    channelViews[activeChannelId].hide();
  }
  activeChannelId = channelId;
  channelViews[channelId].show();
  channelNameSpan.textContent = "#" + channelViews[channelId].label;
}

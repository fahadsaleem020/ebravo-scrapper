const videoModalContainer = document.getElementsByClassName("modal-box")[1];
const downloadButton = document.getElementsByClassName("downloadBtn")[0];
const toggleViewButtons = document.getElementsByClassName("view-btn");
const dialogModal = document.getElementsByClassName("dialogModal")[0];
const videoModal = document.getElementsByClassName("videoModal")[0];
const toast = document.getElementsByClassName("toastContainer")[0];
const gridContainer = document.getElementsByClassName("grid")[0];
const input = document.querySelector("header section input");
const cards = document.getElementsByClassName("card");
const progress = dialogModal.children[0].children[1];
const dialog = document.getElementById("dialog");
// const socket = io("http://localhost:3000");
const socket = io(window.location.origin);
const player = videojs("modalVideoPlayer");
let isFullScreen = false;
let isPaused = false;
let channels = [];

input.addEventListener("keydown", (e) => {
  if (e.code !== "Enter") return;

  gridContainer.innerHTML = "";
  const inputValue = e.target.value.trim().toLowerCase();
  channels
    .filter((channel) => channel.title.toLowerCase().includes(inputValue))
    .map((channel) => {
      gridContainer.innerHTML += card(channel);
    });
});

const scrapTv = async (cat) => {
  let second = 0;

  const timer = setInterval(() => {
    second++;
    if (second > 15 && !channels.length) {
      scrapTv(cat);
      clearInterval(timer);

      dialog.querySelector("p").classList.replace("scale-0", "scale-100");

      setTimeout(() => {
        dialog.querySelector("p").classList.replace("scale-100", "scale-0");
      }, 2500);
    }
  }, 1000);

  try {
    await fetch(`http://localhost:3000/scrapTv/${cat}/${socket.id}`);
  } catch (error) {
    console.error(error);
  }
};

socket.on("scrapstatus", (data) => {
  channels.push(data.channel);
  const loadCard = card(data.channel);
  const percentage = Math.round((channels.length / data.totalChannels) * 100);

  progress.innerHTML = `${percentage}%`;
  progress.setAttribute("style", `--value: ${percentage}`);

  if (percentage === 100) {
    localStorage.getItem("list") && toggleListView("list");
    dialogModal.classList.remove("modal-open");
  }
  gridContainer.innerHTML += loadCard;
});

socket.on("connect", () => {
  openToast("connected to the server", "alert-success");
  scrapTv("All");
});

socket.on("connect_error", () =>
  openToast("server connection failure", "alert-error")
);

const downloadFile = async () => {
  try {
    const response = await fetch("http://localhost:3000/downloadfile", {
      method: "POST",
      body: JSON.stringify({ channels }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const file = await response.blob();
      const url = window.URL.createObjectURL(file);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `iptv(${channels.length}).m3u`;

      document.body.appendChild(a);

      a.click();

      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    openToast(error.message, "alert-error");
    console.log(error);
  }
};

const card = (channel) => {
  return `<div
  class="card rounded-3xl group/card border hover:border-0 border-gray-300 bg-white relative overflow-hidden"
  ondblclick="playMedia('${channel.url}')"
  >
  <figure>
    <img src="${channel.thumb}" class="" alt="tv" />
  </figure>
  <div class="card-body">
    <h2
      class="card-title capitalize justify-center text-slate-600 text-lg font-medium"
    >
      ${channel.title}
    </h2>
  </div>
  <div class="hidden group/menu gap-1 items-center mr-5">
    <div
      class="hidden group-hover/menu:flex border border-gray-300 rounded-full p-1 gap-1"
    >
      <div
      
        class="btn btn-circle h-14 w-14 bg-gray-300 hover:bg-gray-400 text-gray-600 text-lg"
       onClick="copyFun('${channel.url}', this)"
        >
        <i class="fa fa-clone" aria-hidden="true"></i>
      </div>
      <div
      
        class="btn btn-circle h-14 w-14 bg-gray-300 hover:bg-gray-400 text-gray-600 text-lg" onClick="playMedia('${channel.url}')">
        <i class="fa fa-play" aria-hidden="true"></i>
      </div>
    </div>
    <button
      title="menu"
      class="btn btn-circle h-14 w-14 bg-blue-gray-600 hover:bg-blue-gray-800 hover:border-0 border border-blue-gray-400 text-blue-gray-100 text-lg"
    >
      <i class="fa fa-plus" aria-hidden="true"></i>
    </button>
  </div>
  <div
    class="absolute overlay opacity-0 group-hover/card:opacity-100 flex transition-opacity inset-0 glass-bg p-7 flex-col justify-between"
  >
    <h1 class="capitalize text-blue-50 text-xl">${channel.title}</h1>
    <div class="flex justify-between">
      <div
        class="btn btn-circle h-14 w-14 btn-outline hover:bg-blue-gray-600 hover:border-0 border-blue-gray-300 text-blue-gray-50 text-lg"
        onClick="copyFun('${channel.url}', this)"
      >
        <i class="fa fa-clone" aria-hidden="true"></i>
      </div>
      <div
        class="btn btn-circle h-14 w-14 bg-blue-gray-600 hover:bg-blue-gray-800 hover:border-0 border border-blue-gray-400 text-blue-gray-100 text-lg"
        onClick="playMedia('${channel.url}')"
      >
        <i class="fa fa-play" aria-hidden="true"></i>
      </div>
    </div>
  </div>
    </div>`;
};

const toggleListView = (type) => {
  switch (type) {
    case "list":
      localStorage.setItem("list", true);
      for (let card of cards) {
        toggleViewButtons[0].classList.add("border-0");
        toggleViewButtons[1].classList.remove("border-0");
        card.querySelector(".card-body h2").classList.add("!justify-start");
        card.querySelector(".card-body").classList.add("pl-0");
        card.querySelector("figure img").classList.add("w-[60%]");
        card.querySelector("figure").classList.add("basis-1/12");
        card.classList.add("h-24", "rounded-xl");
        card.children[2].classList.add("flex");
        card.children[2].classList.remove("hidden");
        card.children[3].classList.add("hidden");
        card.classList.add("card-side");
        card.classList.add("items-center");
        card.classList.remove("hover:border-0");
      }
      gridContainer.classList.remove(
        "sm:grid-cols-3",
        "md:grid-cols-4",
        "lg:grid-cols-5",
        "xl:grid-cols-5"
      );
      break;

    default:
      localStorage.removeItem("list");
      for (let card of cards) {
        toggleViewButtons[0].classList.remove("border-0");
        toggleViewButtons[1].classList.add("border-0");
        card.querySelector(".card-body h2").classList.remove("!justify-start");
        card.querySelector(".card-body").classList.remove("pl-0");
        card.querySelector("figure img").classList.remove("w-[60%]");
        card.querySelector("figure").classList.remove("basis-1/12");
        card.classList.remove("h-24", "rounded-xl");
        card.children[2].classList.remove("flex");
        card.children[2].classList.add("hidden");
        card.children[3].classList.remove("hidden");
        card.classList.remove("card-side");
        card.classList.remove("items-center");
        card.classList.add("hover:border-0");
      }
      gridContainer.classList.add(
        "sm:grid-cols-3",
        "md:grid-cols-4",
        "lg:grid-cols-5",
        "xl:grid-cols-5"
      );
      break;
  }
};

const copyFun = (url, element) => {
  navigator.clipboard.writeText(url);
  element.querySelector("i").classList.replace("fa-clone", "fa-check");
  setTimeout(() => {
    element.querySelector("i").classList.replace("fa-check", "fa-clone");
  }, 1000);
};

const openVideoModal = (src) => {
  videoModal.classList.add("modal-open");
  player.src({
    src: src,
    type: "application/x-mpegURL",
  });
  player.play();
};

const closeVideoModal = () => {
  player.pause();
  videoModal.classList.remove("modal-open");
};

const playMedia = (url) => {
  openVideoModal(url);
};

const toggleFullScreen = () => {
  if (!videoModal.classList.contains("modal-open")) return;

  if (!player.isFullscreen_) {
    if (modalVideoPlayer.requestFullscreen) {
      modalVideoPlayer.requestFullscreen();
    } else if (modalVideoPlayer.mozRequestFullScreen) {
      modalVideoPlayer.mozRequestFullScreen();
    } else if (modalVideoPlayer.webkitRequestFullscreen) {
      modalVideoPlayer.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
};

const openToast = (text, status = "warning") => {
  let icon = "";
  switch (status) {
    case "alert-success":
      icon = "fa-check-circle-o";
      break;

    case "alert-warning":
      icon = "fa-exclamation-triangle";
      break;

    case "alert-error":
      icon = "fa-times-circle-o";
      break;

    default:
      icon = "fa-exclamation-circle";
      break;
  }

  const content = `<div class="alert ${status} shadow-xl capitalize">
  <i class="fa ${icon} text-xl" aria-hidden="true"></i>
  ${text}
  <button class="btn btn-square btn-ghost btn-sm" onClick="closeToast(0)" >
  <i class="fa fa-times" aria-hidden="true"></i>
</button>
  </div>`;

  toast.innerHTML = content;
  toast.classList.add("toast");

  closeToast();
};

const closeToast = (interval = 5000) => {
  setTimeout(() => {
    toast.innerHTML = "";
    toast.classList.remove("toast");
  }, interval);
};

localStorage.getItem("list") && toggleListView("list");
toggleViewButtons[0].addEventListener("click", () => toggleListView("grid"));
toggleViewButtons[1].addEventListener("click", () => toggleListView("list"));
downloadButton.addEventListener("click", downloadFile);

document.addEventListener("keydown", (e) => {
  e.key === "Escape" ? closeVideoModal() : null;
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !isPaused) {
    player.pause();
    isPaused = !isPaused;
  } else if (e.code === "Space" && isPaused) {
    player.play();
    isPaused = !isPaused;
  } else if (e.code === "KeyF" || e.code === "Enter") {
    toggleFullScreen();
  }
});

videoModal.addEventListener("click", () => closeVideoModal());
videoModalContainer.addEventListener("click", (e) => e.stopPropagation());

class VideoBackgroundComponent extends HTMLElement {
  requiredRefs = ["videoSources", "videoElement"];
  constructor() {
    super();
  }

  connectedCallback() {
    // const { videoSources, videoElement } = this.refs;
    const videoElement = this.querySelector("video");
    const videoSources = this.querySelectorAll("[data-video]");

    for (var i = 0; i < videoSources.length; i++) {
      let source = videoSources[i];
      let videoSource = source.dataset.videoSource;

      if (videoSource) {
        source.setAttribute("src", videoSource);
      }
    }

    videoElement.load();
  }
}
if (!customElements.get('video-background-component')) customElements.define('video-background-component', VideoBackgroundComponent);

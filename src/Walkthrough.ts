import Popper from "popper.js";

export class Walkthrough {
  private _config: [any] = null;
  private _currentElement: any = null;
  private _currentStepIndex: number = 0;
  private _tooltipWindow: any = null;
  private _tooltipHelper: any = null;
  private _tooltipRightOverlay: any = null;
  private _tooltipBottomOverlay: any = null;
  private _tooltipLeftOverlay: any = null;
  private _tooltipTopOverlay: any = null;
  private _tooltipNextButton: any = null;
  private _tooltipPrevButton: any = null;
  private _tooltipCloseButton: any = null;
  private _tooltipExitButton: any = null;
  private _tooltipNumber: any = null;
  private _tooltipInstance: any = null;
  private _helperInstance: any = null;
  private _onExit: any = () => {};
  private _resizeTimeout: number = 200;
  private container: HTMLDivElement;
  private _isExited: Boolean = false;

  constructor(container: HTMLDivElement) {
    this.container = container;
  }

  init() {
    this._tooltipWindow = document.createElement("div");
    this._tooltipWindow.setAttribute("id", "tooltip");
    this._tooltipWindow.classList.add("shifu-window");
    this._tooltipWindow.innerHTML = `
        <div class="shifu-close">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACLSURBVEhL7Y9RCoAwDEN3Ce+o6HG9jyZIocgsSzf/9iA4ZXnBMsmwIstzlGCH3ZAduZATUUZ4lx126fjEX2wdkTtKQZYbLcW03IgE3XKjJhomN97CoXLDjwyXk18HvJxPf+4eecv5XvuWIhJ1j7QI0iNKUR6RC0DqHIj8y8CP0BGyIYrcYIfdiUIpN1CFVil4ciYWAAAAAElFTkSuQmCC" alt="Close"/>
        </div>
        <div class="shifu-number" style="
        visibility: visible;">1</div>
        <div class="shifu-arrow"></div>
        <div class="shifu-body">
            <h4>Callout title is here</h4>
            <div class="content">Message body is optional. If help documentation is available, consider adding a link to learn more at the
                bottom.
            </div>
        </div>
        <div class="shifu-footer">
            <button class="exit-step">Exit</button>
            <div class="shifu-nav">
                <button class="prev-step">Previous</button>
                <button class="next-step">Next</button>
            </div>
        </div>
    `;

    this._tooltipHelper = document.createElement("div");
    this._tooltipHelper.setAttribute("id", "helper");
    this._tooltipHelper.classList.add("shifu-helper");

    this._tooltipTopOverlay = document.createElement("div");
    this._tooltipTopOverlay.setAttribute("id", "overlay-top");
    this._tooltipTopOverlay.classList.add("shifu-overlay");
    this._tooltipTopOverlay.classList.add("top");


    this._tooltipBottomOverlay = document.createElement("div");
    this._tooltipBottomOverlay.setAttribute("id", "overlay-bottom");
    this._tooltipBottomOverlay.classList.add("shifu-overlay");
    this._tooltipBottomOverlay.classList.add("bottom");

    this._tooltipLeftOverlay = document.createElement("div");
    this._tooltipLeftOverlay.setAttribute("id", "overlay-left");
    this._tooltipLeftOverlay.classList.add("shifu-overlay");
    this._tooltipLeftOverlay.classList.add("left");

    this._tooltipRightOverlay = document.createElement("div");
    this._tooltipRightOverlay.setAttribute("id", "overlay-right");
    this._tooltipRightOverlay.classList.add("shifu-overlay");
    this._tooltipRightOverlay.classList.add("right");

    this.container.appendChild(this._tooltipWindow);
    this.container.appendChild(this._tooltipHelper);
    this.container.appendChild(this._tooltipTopOverlay);
    this.container.appendChild(this._tooltipBottomOverlay);
    this.container.appendChild(this._tooltipLeftOverlay);
    this.container.appendChild(this._tooltipRightOverlay);

    this._tooltipNextButton = this._tooltipWindow.querySelector(".next-step");
    this._tooltipPrevButton = this._tooltipWindow.querySelector(".prev-step");
    this._tooltipExitButton = this._tooltipWindow.querySelector(".exit-step");
    this._tooltipCloseButton = this._tooltipWindow.querySelector(
      ".shifu-close"
    );
    this._tooltipNumber = this._tooltipWindow.querySelector(".shifu-number");
    
    this.hookListeners();
    this.handleWindowResize();
  }

  start(config: [any], { start, onExit, resizeTimeout }: any) {
    this.init();
    this._config = config;
    this._onExit = onExit;
    this._currentStepIndex = start || 0;
    this._resizeTimeout = resizeTimeout;
    this.goToStepNumber(this._currentStepIndex);
    this._isExited = false;
  }

  handleWindowResize() {
    let resizeTimer;
    window.onresize = () => {
      if (this._isExited) {
        // if exited then dont do anything
        return;
      }

      clearTimeout(resizeTimer);

      // destroy existing tooltip
      this.destroyHelper();
      this.destroyTooltip();

      resizeTimer = setTimeout(() => {
        // gotostep number again
        this.goToStepNumber(this._currentStepIndex);
      }, this._resizeTimeout);
    };
  }

  hookListeners() {
    const nextButton = this._tooltipNextButton;
    const prevButton = this._tooltipPrevButton;
    const closeButton = this._tooltipCloseButton;
    const exitButton = this._tooltipExitButton;

    nextButton.addEventListener("click", () => this.goToNextStep());
    prevButton.addEventListener("click", () => this.goToPreviousStep());
    closeButton.addEventListener("click", () => this.exit());
    exitButton.addEventListener("click", () => this.exit());
  }

  goToNextStep() {
    // check for end of steps
    if (this._config.length === this._currentStepIndex + 1) {
      this.exit();
      return;
    }

    // call the onAfter of the current node
    this.triggerOnAfter(
      this._currentElement,
      this._config[this._currentStepIndex]
    );

    // destroy existing tooltip
    this.destroyTooltip();

    // increment step
    this._currentStepIndex += 1;
    this.goToStepNumber(this._currentStepIndex);
  }

  exit() {
    // call the onAfter of the current node
    this.triggerOnAfter(
      this._currentElement,
      this._config[this._currentStepIndex]
    );

    // destroy existing tooltip
    this.destroyHelper();
    this.destroyTooltip();

    // recreate dom elements to renew handlers
    this.recreateElement(this._tooltipNextButton);
    this.recreateElement(this._tooltipPrevButton);
    this.recreateElement(this._tooltipCloseButton);

    //  Call onExit event
    this._onExit({ stepIndex: this._currentStepIndex });

    this._currentStepIndex = 0;
    this._isExited = true;
    return;
  }

  goToPreviousStep() {
    if (this._currentStepIndex === 0) {
      return;
    }

    // call the onAfter of the current node
    this.triggerOnAfter(
      this._currentElement,
      this._config[this._currentStepIndex]
    );

    // destroy existing tooltip
    this.destroyTooltip();

    // decrement step
    this._currentStepIndex -= 1;
    this.goToStepNumber(this._currentStepIndex);
  }

  goToStepNumber(stepIndex: number) {
    const stepConfig = this._config[stepIndex];
    const stepElement = stepConfig.element();
    const highlightElement = stepConfig.highlight
      ? stepConfig.highlight()
      : stepElement;

    if (!stepElement) {
      console.warn(
        "Shifu cannot navigate to the step, node not found",
        stepIndex + 1
      );
      return;
    }

    this._currentElement = stepElement;

    // trigger onBefore
    const { onBefore } = stepConfig;

    if (onBefore && typeof onBefore === "function") {
      onBefore(stepElement, stepConfig, this.goToNextStep.bind(this));
    }

    this.showTooltip(stepElement, stepConfig);
    this.showHelper(highlightElement, stepConfig);

    // disable buttons as per config
    const { disableNext, disablePrev, highlight } = stepConfig;

    if (disableNext) {
      this._tooltipNextButton.setAttribute("disabled", "disabled");
    }

    // Change button for last step
    if (stepIndex === this._config.length - 1) {
      this._tooltipNextButton.innerText = "Finish";
    }

    // Disable Prev button
    if (disablePrev || stepIndex === 0) {
      this._tooltipPrevButton.setAttribute("disabled", "disabled");
    }

    // Hide the highlight
    const arrowElement = this._tooltipWindow.querySelector(".shifu-arrow");
    if (highlight) {
      arrowElement.classList.add("show-highlight");
    } else {
      arrowElement.classList.remove("show-highlight");
    }

    // Show the number
    this._tooltipNumber.style.visibility = "visible";
    this._tooltipNumber.innerText = stepIndex + 1;
  }

  triggerOnAfter(element: any, config: any) {
    const { onAfter } = config;

    if (onAfter && typeof onAfter === "function") {
      onAfter(element, config);
    }
  }

  destroyTooltip() {
    if (!this._tooltipInstance) {
      return;
    }

    this._tooltipWindow.style.visibility = "hidden";
    this._tooltipHelper.style.visibility = "hidden";
    this._tooltipNumber.style.visibility = "hidden";
    this._tooltipInstance.destroy();
    this._tooltipNextButton.removeAttribute("disabled");
    this._tooltipNextButton.innerText = "Next";
    this._tooltipPrevButton.removeAttribute("disabled");
    this.hideOverlayVisibility();
  }

  showTooltip(element: any, config: any) {
    const arrowElement = this._tooltipWindow.querySelector(".shifu-arrow");

    this._tooltipInstance = new Popper(element, this._tooltipWindow, {
      placement: config.placement || "bottom",
      eventsEnabled: false,
      onCreate: () => {
        this.buildTooltipContent();
      },
      modifiers: {
        computeStyle: {
          gpuAcceleration: false
        },
        arrow: {
          element: arrowElement
        },
        customStyle: {
          order: 851,
          enabled: true,
          fn: data => this.customTooltipStyleModifier(data)
        }
      }
    });
  }

  customTooltipStyleModifier(data) {
    const { placement, popper, styles, arrowStyles } = data;
    const inverted = placement === "top" || placement.indexOf("top") > -1;

    data.styles = {
      ...styles,
      top: inverted ? styles.top - 32 : styles.top + 16,
      visibility: "visible",
      willChange: "unset" // disabling due to scaling
    };

    // apply styles to the arrow
    if (inverted) {
      data.arrowStyles = {
        ...arrowStyles,
        top: "100%",
        backgroundColor: "#f4f4f4"
      };
    } else {
      data.arrowStyles = {
        ...arrowStyles,
        backgroundColor: "#FFFFFF"
      };
    }

    return data;
  }

  hideOverlayVisibility() {
    this._tooltipRightOverlay.style.visibility = "collapse";
    this._tooltipLeftOverlay.style.visibility = "collapse";
    this._tooltipBottomOverlay.style.visibility = "collapse";
    this._tooltipTopOverlay.style.visibility = "collapse";
  }

  buildTooltipContent() {
    const stepIndex = this._currentStepIndex;
    const stepConfig = this._config[stepIndex];

    const titleElement = this._tooltipWindow.querySelector("h4");
    const contentElement = this._tooltipWindow.querySelector(".content");

    titleElement.innerText = stepConfig.title || "";

    if (typeof stepConfig.content === "string") {
      contentElement.innerHTML = stepConfig.content;
    }
    if (typeof stepConfig.content === "function") {
      contentElement.innerHTML = stepConfig.content();
    }
  }

  destroyHelper() {
    if (!this._helperInstance) {
      return;
    }

    this._helperInstance.destroy();
  }

  showHelper(element: any, config: any) {
    // destroy existing helper
    this.destroyHelper();

    this._helperInstance = new Popper(element, this._tooltipHelper, {
      placement: "bottom-start",
      eventsEnabled: false,
      onCreate: () => {},
      modifiers: {
        computeStyle: {
          gpuAcceleration: false
        },
        customStyle: {
          order: 851,
          enabled: true,
          fn: (data: any) =>
            this.customHelperStyleModifier(data, element, config)
        }
      }
    });
  }

  customHelperStyleModifier(data: any, element: any, config: any) {
    const { interactive } = config;
    // const { top, left } = data.styles;
    const boundingRect = element.getBoundingClientRect();
    const { top, left, height, width } = boundingRect;

    const paddingOffset = 10;
    const paddingLeftOffset = left > paddingOffset ? left - paddingOffset : 0;
    const effectiveHeight = top - paddingOffset > 0 ? top - paddingOffset : 0;

    this._tooltipRightOverlay.style.visibility = "visible";
    this._tooltipRightOverlay.style.left = left + width + paddingOffset + "px";

    this._tooltipLeftOverlay.style.visibility = "visible";
    this._tooltipLeftOverlay.style.width = paddingLeftOffset + "px";

    this._tooltipBottomOverlay.style.visibility = "visible";
    this._tooltipBottomOverlay.style.top = top + height + paddingOffset + "px";
    this._tooltipBottomOverlay.style.left = paddingLeftOffset + "px";
    this._tooltipBottomOverlay.style.width = width + paddingOffset * 2 + "px";

    this._tooltipTopOverlay.style.visibility = "visible";
    this._tooltipTopOverlay.style.left = paddingLeftOffset + "px";
    this._tooltipTopOverlay.style.height = effectiveHeight + "px";
    this._tooltipTopOverlay.style.width = width + paddingOffset * 2 + "px";

    // disable willChange
    data.styles = {
      ...data.styles,
      willChange: "unset"
    };

    if (!interactive) {
      // render a dummy overlaying the element if it is not interactive
      data.styles = {
        ...data.styles,
        height: height + paddingOffset * 2,
        width: width + paddingOffset * 2,
        left: left - paddingOffset,
        top: top - paddingOffset,
        visibility: "visible"
      };
    }

    return data;
  }

  recreateElement(element: any) {
    element.parentNode.replaceChild(element.cloneNode(true), element);
  }
}

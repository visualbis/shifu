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
  private _tooltipNumber: any = null;
  private _tooltipInstance: any = null;
  private _helperInstance: any = null;
  private _onExit: any = () => {};
  private _resizeTimeout: number = 200;

  constructor() {
    this._tooltipWindow = document.querySelector("#tooltip");
    this._tooltipHelper = document.querySelector("#helper");
    this._tooltipRightOverlay = document.querySelector("#overlay-right");
    this._tooltipBottomOverlay = document.querySelector("#overlay-bottom");
    this._tooltipLeftOverlay = document.querySelector("#overlay-left");
    this._tooltipTopOverlay = document.querySelector("#overlay-top");
    this._tooltipNextButton = this._tooltipWindow.querySelector(".next-step");
    this._tooltipPrevButton = this._tooltipWindow.querySelector(".prev-step");
    this._tooltipCloseButton = this._tooltipWindow.querySelector(
      ".shifu-close"
    );
    this._tooltipNumber = this._tooltipWindow.querySelector(".shifu-number");
    this.hookListeners();
    this.handleWindowResize();
  }

  start(config: [any], { start, onExit, resizeTimeout }: any) {
    this._config = config;
    this._onExit = onExit;
    this._currentStepIndex = start || 0;
    this._resizeTimeout = resizeTimeout;
    this.goToStepNumber(this._currentStepIndex);
  }

  handleWindowResize() {
    let resizeTimer;
    window.onresize = () => {
      clearTimeout(resizeTimer);

      // destroy existing tooltip
      this.destroyHelper();
      this.destroyTooltip();

      resizeTimer = setTimeout(() => {
        // gotostep number again
        this.goToStepNumber(this._currentStepIndex);
      }, 500);
    };
  }

  hookListeners() {
    const nextButton = this._tooltipNextButton;
    const prevButton = this._tooltipPrevButton;
    const closeButton = this._tooltipCloseButton;

    nextButton.addEventListener("click", () => this.goToNextStep());
    prevButton.addEventListener("click", () => this.goToPreviousStep());
    closeButton.addEventListener("click", () => this.exit());
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
    const { disableNext, disablePrev } = stepConfig;

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

    // Show the number
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

    this._tooltipInstance.destroy();
    this._tooltipWindow.style.visibility = "hidden";
    this._tooltipHelper.style.visibility = "hidden";
    this._tooltipNextButton.removeAttribute("disabled");
    this._tooltipNextButton.innerText = "Next";
    this._tooltipPrevButton.removeAttribute("disabled");
    this.hideOverlayVisibility();
    // this.toggleTargetElementClass(element, "remove");
  }

  showTooltip(element: any, config: any) {
    const arrowElement = document.querySelector(".shifu-arrow");

    this._tooltipInstance = new Popper(element, this._tooltipWindow, {
      placement: config.placement || "bottom",
      eventsEnabled: false,
      onCreate: () => {
        this.buildTooltipContent();
      },
      modifiers: {
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
      visibility: "visible"
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

    const paddingOffset = 0;
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

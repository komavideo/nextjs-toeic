type ModalFocusTrapParams = {
  activeElement: Element | null;
  dialog: Pick<HTMLElement, "contains"> | null;
  focusableElements: HTMLElement[];
  shiftKey: boolean;
};

type ModalFocusTrapResult = {
  shouldPreventDefault: boolean;
  focusTarget?: HTMLElement;
};

type ModalFocusRestoreParams = {
  documentContains: (element: Element) => boolean;
  isHTMLElement: (element: Element) => element is HTMLElement;
  previousActiveElement: Element | null;
};

export function isModalCloseKey(key: string): boolean {
  return key === "Escape";
}

export function getModalFocusRestoreTarget({
  documentContains,
  isHTMLElement,
  previousActiveElement,
}: ModalFocusRestoreParams): HTMLElement | undefined {
  if (
    previousActiveElement &&
    isHTMLElement(previousActiveElement) &&
    documentContains(previousActiveElement)
  ) {
    return previousActiveElement;
  }

  return undefined;
}

export function getModalFocusTrapResult({
  activeElement,
  dialog,
  focusableElements,
  shiftKey,
}: ModalFocusTrapParams): ModalFocusTrapResult {
  if (focusableElements.length === 0) {
    return { shouldPreventDefault: true };
  }

  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  if (focusableElements.length === 1) {
    return {
      focusTarget: firstFocusableElement,
      shouldPreventDefault: true,
    };
  }

  if (!dialog?.contains(activeElement)) {
    return {
      focusTarget: shiftKey ? lastFocusableElement : firstFocusableElement,
      shouldPreventDefault: true,
    };
  }

  if (shiftKey && activeElement === firstFocusableElement) {
    return {
      focusTarget: lastFocusableElement,
      shouldPreventDefault: true,
    };
  }

  if (!shiftKey && activeElement === lastFocusableElement) {
    return {
      focusTarget: firstFocusableElement,
      shouldPreventDefault: true,
    };
  }

  return { shouldPreventDefault: false };
}

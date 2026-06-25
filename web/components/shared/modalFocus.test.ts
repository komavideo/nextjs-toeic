import assert from "node:assert/strict";
import test from "node:test";
import {
  getModalFocusRestoreTarget,
  getModalFocusTrapResult,
  isModalCloseKey,
} from "./modalFocus.ts";

function createElement(name: string): HTMLElement {
  return { name } as unknown as HTMLElement;
}

function createDialog(
  focusableElements: HTMLElement[],
): Pick<HTMLElement, "contains"> {
  return {
    contains: (element) => focusableElements.includes(element as HTMLElement),
  };
}

test("Escape キーをモーダルの閉じる操作として扱う", () => {
  assert.equal(isModalCloseKey("Escape"), true);
  assert.equal(isModalCloseKey("Enter"), false);
});

test("復帰先が HTML 要素かつ文書内に残っている場合だけフォーカスを戻す", () => {
  const previousElement = createElement("previous");
  const restoreTarget = getModalFocusRestoreTarget({
    documentContains: (element) => element === previousElement,
    isHTMLElement: (element): element is HTMLElement => element === previousElement,
    previousActiveElement: previousElement,
  });
  const detachedTarget = getModalFocusRestoreTarget({
    documentContains: () => false,
    isHTMLElement: (element): element is HTMLElement => element === previousElement,
    previousActiveElement: previousElement,
  });
  const nonHtmlTarget = getModalFocusRestoreTarget({
    documentContains: () => true,
    isHTMLElement: (element): element is HTMLElement => {
      void element;
      return false;
    },
    previousActiveElement: previousElement,
  });

  assert.equal(restoreTarget, previousElement);
  assert.equal(detachedTarget, undefined);
  assert.equal(nonHtmlTarget, undefined);
});

test("フォーカス可能要素がない場合は Tab 移動を止める", () => {
  const result = getModalFocusTrapResult({
    activeElement: null,
    dialog: createDialog([]),
    focusableElements: [],
    shiftKey: false,
  });

  assert.equal(result.shouldPreventDefault, true);
  assert.equal(result.focusTarget, undefined);
});

test("フォーカス可能要素が1つの場合は同じ要素へ留める", () => {
  const onlyElement = createElement("only");
  const result = getModalFocusTrapResult({
    activeElement: onlyElement,
    dialog: createDialog([onlyElement]),
    focusableElements: [onlyElement],
    shiftKey: false,
  });

  assert.equal(result.shouldPreventDefault, true);
  assert.equal(result.focusTarget, onlyElement);
});

test("先頭で Shift+Tab した場合は末尾へ循環する", () => {
  const firstElement = createElement("first");
  const lastElement = createElement("last");
  const result = getModalFocusTrapResult({
    activeElement: firstElement,
    dialog: createDialog([firstElement, lastElement]),
    focusableElements: [firstElement, lastElement],
    shiftKey: true,
  });

  assert.equal(result.shouldPreventDefault, true);
  assert.equal(result.focusTarget, lastElement);
});

test("末尾で Tab した場合は先頭へ循環する", () => {
  const firstElement = createElement("first");
  const lastElement = createElement("last");
  const result = getModalFocusTrapResult({
    activeElement: lastElement,
    dialog: createDialog([firstElement, lastElement]),
    focusableElements: [firstElement, lastElement],
    shiftKey: false,
  });

  assert.equal(result.shouldPreventDefault, true);
  assert.equal(result.focusTarget, firstElement);
});

test("フォーカスがモーダル外へ出ている場合は Tab 方向に応じて戻す", () => {
  const firstElement = createElement("first");
  const lastElement = createElement("last");
  const outsideElement = createElement("outside");
  const dialog = createDialog([firstElement, lastElement]);

  const forwardResult = getModalFocusTrapResult({
    activeElement: outsideElement,
    dialog,
    focusableElements: [firstElement, lastElement],
    shiftKey: false,
  });
  const backwardResult = getModalFocusTrapResult({
    activeElement: outsideElement,
    dialog,
    focusableElements: [firstElement, lastElement],
    shiftKey: true,
  });

  assert.equal(forwardResult.shouldPreventDefault, true);
  assert.equal(forwardResult.focusTarget, firstElement);
  assert.equal(backwardResult.shouldPreventDefault, true);
  assert.equal(backwardResult.focusTarget, lastElement);
});

test("中間要素では既定の Tab 移動を妨げない", () => {
  const firstElement = createElement("first");
  const middleElement = createElement("middle");
  const lastElement = createElement("last");
  const result = getModalFocusTrapResult({
    activeElement: middleElement,
    dialog: createDialog([firstElement, middleElement, lastElement]),
    focusableElements: [firstElement, middleElement, lastElement],
    shiftKey: false,
  });

  assert.equal(result.shouldPreventDefault, false);
  assert.equal(result.focusTarget, undefined);
});

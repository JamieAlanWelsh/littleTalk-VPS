import { useEffect, type RefObject } from "react";

/**
 * Publishes an element's natural (unscaled) layout height as a px CSS variable.
 *
 * Used by the exercise/game scaling system, which fits content to the viewport
 * with `transform: scale()` instead of CSS `zoom` for consistent Chrome/Safari
 * behaviour. Because a transform does not reflow surrounding layout, the scaled
 * element compensates with a margin derived from this variable. `offsetHeight`
 * is read deliberately: it reports the pre-transform layout height identically
 * across browsers, so the compensation stays accurate on Safari/iPad.
 */
export const useScaledHeightVar = (
    ref: RefObject<HTMLElement | null>,
    cssVarName: string,
): void => {
    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        const publishHeight = () => {
            element.style.setProperty(cssVarName, `${element.offsetHeight}px`);
        };

        publishHeight();

        const resizeObserver = new ResizeObserver(publishHeight);
        resizeObserver.observe(element);

        return () => {
            resizeObserver.disconnect();
            element.style.removeProperty(cssVarName);
        };
    }, [ref, cssVarName]);
};

/**
 * Cookie utility functions
 */

/**
 * Read a cookie value by name
 * @param name - The cookie name to read
 * @returns The cookie value, or null if not found
 */
export function readCookie(name: string): string | null {
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

  return cookieValue || null;
}

/**
 * Read the CSRF token from the csrftoken cookie
 * @returns The CSRF token value, or null if not found
 */
export function readCsrfTokenFromCookie(): string | null {
  return readCookie("csrftoken");
}

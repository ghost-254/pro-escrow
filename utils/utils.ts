/**
 * Returns a color based on the provided letter.
 * @param {string} letter - The letter to get the color for.
 * @returns {string} The color hex code corresponding to the letter, defaulting to gray if not found.
 */
export const getColorForLetter = (letter: string): string => {
  const colors: Record<string, string> = {
    A: "#FF1493",
    B: "#FF6347",
    C: "#FFA500",
    D: "#FF4500",
    E: "#FF0000",
    F: "#DC143C",
    G: "#FF69B4",
    H: "#FFC0CB",
    I: "#FFD700",
    J: "#00CED1",
    K: "#00DF00",
    L: "#7FFF00",
    M: "#32CD32",
    N: "#00FF7F",
    O: "#3CB371",
    P: "#00DF00",
    Q: "#008000",
    R: "#008080",
    S: "#0000FF",
    T: "#4169E1",
    U: "#0000FF",
    V: "#800080",
    W: "#9400D3",
    X: "#4B0082",
    Y: "#800080",
    Z: "#800080",
  };

  const upperCaseLetter = letter?.toUpperCase();
  return colors[upperCaseLetter] || "#808080"; // Default to gray if letter not found
};

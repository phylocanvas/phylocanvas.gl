export default function colourArrayToCssRGBA(colourArray, ignoreAlpha = true) {
  const [ r, g, b, a = 255 ] = colourArray;

  if (a === 0) {
    return "none";
  }

  if (ignoreAlpha || a === 255) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  else {
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  }
}

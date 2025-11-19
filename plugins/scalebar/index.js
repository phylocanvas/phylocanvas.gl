import renderer from "./renderer";

import colourArrayToCssRGBA from "../../utils/colour-array-to-css";

export default function (tree, decorate) {
  decorate("init", (delegate, args) => {

    delegate(...args);

    tree.addLayer(
      "scalebar",
      (props) => props.scalebar !== false,
      renderer,
    );
  });

  decorate("exportSVG", (delegate, args) => {
    const layer = tree.deck.layerManager.layers.find((x) => x.id === "scalebar-plugin");

    if (layer) {
      const svg = delegate(false);

      svg.pop();

      {
        svg.push(`<g transform="translate(${svg.centre.join(" ")})" >\n`);

        //#region Draw line
        const { lineWidth, lineColour } = layer.props;
        const [ line ] = layer.props.data.lines;

        svg.push(`<g stroke="${colourArrayToCssRGBA(lineColour)}" stroke-width="${lineWidth}" >\n`);

        svg.push(`<line x1="${line.sourcePosition[0]}" y1="${line.sourcePosition[1]}" x2="${line.targetPosition[0]}" y2="${line.targetPosition[1]}"  />\n`);

        svg.push("</g>\n");

        //#endregion

        //#region Draw label

        const { fontFamily, fontSize } = layer.props;
        const [ label ] = layer.props.data.labels;

        svg.push(`<g font-family="${fontFamily.replace(/"/g, "'")}" font-size="${fontSize}">\n`);

        const [ x, y ] = label.position;
        svg.push(`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="auto" style="padding-bottom:2px">${label.text}</text>\n`);

        svg.push("</g>\n");

        //#endregion

        svg.push("</g>\n");
      }

      svg.push("</svg>\n");

      const [ returnBlob = true ] = args;
      if (returnBlob) {
        return new Blob(
          svg,
          { type: "image/svg+xml" },
        );
      }
      else {
        return svg;
      }
    }
    else {
      return delegate(...args);
    }

  });

}

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

      const svgElementEnding = svg.pop();

      {
        svg.push(`<g id="scalebar-plugin">\n`);

        //#region Draw line
        const { lineWidth, lineColour } = layer.props;
        const [ line ] = layer.props.data.lines;
        const source = svg.projectPoint(line.sourcePosition);
        const target = svg.projectPoint(line.targetPosition);

        svg.push(`<g stroke="${colourArrayToCssRGBA(lineColour)}" stroke-width="${lineWidth}" >\n`);

        svg.push(`<line x1="${source[0]}" y1="${source[1]}" x2="${target[0]}" y2="${target[1]}"  />\n`);

        svg.push("</g>\n");

        //#endregion

        //#region Draw label

        const { fontFamily, fontSize } = layer.props;
        const [ label ] = layer.props.data.labels;

        svg.push(`<g font-family="${fontFamily.replace(/"/g, "'")}" font-size="${fontSize}">\n`);

        const [ x, y ] = svg.projectPoint(label.position);
        svg.push(`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="auto" style="padding-bottom:2px">${label.text}</text>\n`);

        svg.push("</g>\n");

        //#endregion

        svg.push("</g>\n");
      }

      svg.push(svgElementEnding);

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

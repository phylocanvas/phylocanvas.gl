// Phylocanvas.gl (https://phylocanvas.gl)
// Centre for Genomic Pathogen Surveillance.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import labelledLeafNodesMemo from "../layers/leaf-labels/labelled-leaf-nodes";
import textPositionAccessorMemo from "../layers/leaf-labels/text-position-accessor";

import shapeBorderWidthMemo from "../layers/shapes/shape-border-width";
import shapeBorderColourMemo from "../layers/shapes/border-colour";

import blocksDataMemo from "../layers/metadata/blocks-data";
import headersDataMemo from "../layers/metadata/headers-data";
import pixelOffsetAccessorMemo from "../layers/metadata/pixel-offset-accessor";
import metadataHeaderFontSizeMemo from "../layers/metadata/font-size";

import lineColourMemo from "../layers/edges/line-colour";

import drawVectorShape from "../utils/draw-vector-shape";
import colourArrayToCssRGBA from "../utils/colour-array-to-css";

import { Angles, TreeTypes } from "../constants";

function polarToCartesian(centerX, centerY, radius, angleInRadians) {
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = (endAngle - startAngle) <= Math.PI ? "0" : "1";

  const d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ];

  return `<path fill="none" d="${d.join(" ")}" />`;
}

export default function exportSVG(returnBlob = true) {
  const nodes = this.getGraphAfterLayout();
  const size = this.getCanvasSize();
  const type = this.getTreeType();
  const nodeSize = this.getNodeSize();
  const nodeRadius = nodeSize * 0.5;
  const scale = this.getScale(true);
  const projectPoint = (point) => this.projectPoint(point, scale);
  const clipPathId = `phylocanvas-clip-path`;

  const svg = [];
  const pushLine = (sourcePoint, targetPoint) => {
    const source = projectPoint(sourcePoint);
    const target = projectPoint(targetPoint);
    svg.push(`<line x1="${source[0]}" y1="${source[1]}" x2="${target[0]}" y2="${target[1]}"  />\n`);
  };

  svg.push(`<svg viewBox="0 0 ${size.width} ${size.height}" xmlns="http://www.w3.org/2000/svg">\n`);

  svg.push(`<defs><clipPath id="${clipPathId}"><rect x="0" y="0" width="${size.width}" height="${size.height}" /></clipPath></defs>\n`);

  svg.push(`<g clip-path="url(#${clipPathId})">\n`);

  {
    //#region Draw lines
    const lineWidth = this.getStrokeWidth();
    const lineColour = colourArrayToCssRGBA(lineColourMemo(this));

    svg.push(`<g stroke="${lineColour}" stroke-width="${lineWidth}" >\n`);

    for (let i = nodes.firstIndex + 1; i < nodes.lastIndex; i++) {
      const node = nodes.preorderTraversal[i];

      if (type === TreeTypes.Circular) {
        pushLine([ node.x, node.y ], [ node.cx, node.cy ]);

        if (node.children && node.children.length && !node.isCollapsed) {
          const firstChild = node.children[0];
          const lastChild = node.children[node.children.length - 1];
          const root = projectPoint([ nodes.root.x, nodes.root.y ]);
          svg.push(
            describeArc(
              root[0],
              root[1],
              node.dist * scale,
              firstChild.angle,
              lastChild.angle,
            )
          );
        }
      }
      else if (type === TreeTypes.Diagonal || type === TreeTypes.Radial) {
        pushLine([ node.x, node.y ], [ node.parent.x, node.parent.y ]);
      }
      else if (type === TreeTypes.Hierarchical) {
        pushLine([ node.x, node.y ], [ node.x, node.parent.y ]);
        pushLine([ node.x, node.parent.y ], [ node.parent.x, node.parent.y ]);
      }
      else if (type === TreeTypes.Rectangular) {
        pushLine([ node.x, node.y ], [ node.parent.x, node.y ]);
        pushLine([ node.parent.x, node.y ], [ node.parent.x, node.parent.y ]);
      }

      // skip collapsed sub-trees
      if (node.isCollapsed) {
        i += node.totalNodes - 1;
      }
    }
    svg.push("</g>\n");

    //#endregion

    //#region Draw node shapes

    if (this.props.showShapes) {
      const showShapeBorders = this.props.showShapeBorders;

      let shapeBorderWidth = "";
      let shapeBorderColour = "";
      if (showShapeBorders) {
        shapeBorderWidth = shapeBorderWidthMemo(this);
        shapeBorderColour = colourArrayToCssRGBA(shapeBorderColourMemo(this));
      }

      svg.push("<g>\n");

      for (let i = nodes.firstIndex; i < nodes.lastIndex; i++) {
        const node = nodes.preorderTraversal[i];
        if (node.isLeaf && node.shape && !node.isHidden) {
          const position = projectPoint([ node.x, node.y ]);
          svg.push(
            drawVectorShape(
              node.shape,
              position[0],
              position[1],
              nodeRadius,
              colourArrayToCssRGBA(node.fillColour),
              shapeBorderColour,
              shapeBorderWidth,
            )
          );
          svg.push("\n");
        }
        // skip collapsed subtrees
        if (node.isCollapsed) {
          i += node.totalNodes - 1;
        }
      }

      svg.push("</g>\n");
    }
  
    //#endregion

    //#region Draw labels

    if (this.props.showLabels && this.props.showLeafLabels) {
      const labelledLeafNodes = labelledLeafNodesMemo(this);
      const textPositionAccessor = textPositionAccessorMemo(this);
      const fontFamily = this.getFontFamily();
      const fontSize = this.getFontSize();

      if (this.getAlignLeafLabels()) {
        const labelLineWidth = this.getStrokeWidth() * 0.5;
        const labelLineColour = colourArrayToCssRGBA(this.getStrokeColour());

        svg.push(`<g stroke="${labelLineColour}" stroke-width="${labelLineWidth}" opacity="0.54">\n`);

        for (const nodes of labelledLeafNodes) {
          for (const node of nodes) {
            const [ x, y ] = textPositionAccessor(node);
            pushLine([ x, y ], [ node.x, node.y ]);
          }
        }

        svg.push("</g>\n");
      }

      svg.push(`<g font-family="${fontFamily.replace(/"/g, "'")}" font-size="${fontSize}">\n`);

      for (const nodes of labelledLeafNodes) {
        for (const node of nodes) {
          const [ x, y ] = textPositionAccessor(node);
          const position = projectPoint([ x, y ]);
          const degrees = ((node.angle / Angles.Degrees360) * 360) + (node.inverted ? 180 : 0);
          svg.push(`<text x="${position[0]}" y="${position[1]}" text-anchor="${node.inverted ? "end" : "start"}" dominant-baseline="middle" transform="rotate(${degrees},${position[0]},${position[1]})">${node.label}</text>\n`);
        }
      }

      svg.push("</g>\n");
    }

    //#endregion

    //#region Metadata blocks

    const pixelOffset = this.getPixelOffsets().length;
    const blockWidth = this.getBlockSize();
    const blockHalfWidth = blockWidth / 2;
    const stepSize = this.getStepScale() * scale;
    const blockHeight = (!this.isOrthogonal() || (stepSize > blockWidth)) ? blockWidth : stepSize;
    const blockHalfHeight = blockHeight / 2;
    const blocks = blocksDataMemo(this);
    for (const datum of blocks) {
      const degrees = ((datum.node.angle / Angles.Degrees360) * 360) + (datum.node.inverted ? 180 : 0);
      const point = [
        datum.position[0] + ((datum.offsetX + pixelOffset) * Math.cos(datum.node.angle)) / scale,
        datum.position[1] + ((datum.offsetX + pixelOffset) * Math.sin(datum.node.angle)) / scale,
      ];
      const [ x, y ] = projectPoint(point);
      svg.push(`<rect x="${x - blockHalfWidth}" y="${y - blockHalfHeight}" width="${blockWidth}" height="${blockHeight}" transform="rotate(${degrees},${x},${y})" fill="${colourArrayToCssRGBA(datum.colour)}" />\n`);
    }

    //#endregion

    //#region Metadata headers
    if (this.hasMetadataHeaders()) {
      const headersData = headersDataMemo(this);
      const fontFamily = this.getFontFamily();
      const fontSize = metadataHeaderFontSizeMemo(this);
      const pixelOffsetAccessor = pixelOffsetAccessorMemo(this);

      svg.push(`<g font-family="${fontFamily.replace(/"/g, "'")}" font-size="${fontSize}">\n`);

      for (const datum of headersData) {
        const [ offsetX, offsetY ] = pixelOffsetAccessor(datum);
        const [ positionX, positionY ] = datum.position;
        const [ x, y ] = projectPoint([
          positionX + (offsetX / scale),
          positionY + (offsetY / scale),
        ]);
        const degrees = (datum.angle) - ((datum.angle % 360 === 0) ? 0 : 180);
        svg.push(`<text x="${x}" y="${y}" text-anchor="${datum.inverted ? "end" : "start"}" dominant-baseline="middle" transform="rotate(${degrees},${x},${y})">${datum.text}</text>\n`);
      }

      svg.push("</g>\n");
    }
    //#endregion
  }
    
  svg.push("</g>\n");

  svg.push("</svg>\n");

  if (returnBlob) {
    return new Blob(
      svg,
      { type: "image/svg+xml" },
    );
  }
  else {
    svg.projectPoint = projectPoint;
    return svg;
  }
}

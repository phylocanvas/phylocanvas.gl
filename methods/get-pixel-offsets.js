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

import { TreeTypes, EmptyObject, EmptyArray } from "../constants";

import memoise from "../utils/memoise";
import measureTextWidth from "../utils/measure-text-width";

const longestLabelMemo = memoise(
  (tree) => tree.getGraphWithoutLayout(),
  (tree) => (tree.props.styles || EmptyObject),
  (
    graph,
    styles,
  ) => {
    let maxLabel = "";
    for (let i = 0; i < graph.root.totalNodes; i++) {
      const node = graph.preorderTraversal[graph.root.preIndex + i];
      if (node.isLeaf && !node.isHidden) {
        const label = (node.id in styles ? styles[node.id].label : null) || node.label || node.id;
        if (label.length > maxLabel.length) {
          maxLabel = label;
        }
      }
    }
    return maxLabel;
  }
);
longestLabelMemo.displayName = "longest-label";

const maxLabelWidthMemo = memoise(
  longestLabelMemo,
  (tree) => tree.getFontFamily(),
  (tree) => tree.getFontSize(),
  measureTextWidth,
);
maxLabelWidthMemo.displayName = "max-label-width";

const metadataHeadersLengthMemo = memoise(
  (tree) => tree.props.blocks || EmptyArray,
  (tree) => tree.getFontFamily(),
  (tree) => tree.getBlockHeaderFontSize(),
  (
    blocks,
    fontFamily,
    fontSize,
  ) => {
    let longestLabel = 0;
    for (const header of blocks) {
      longestLabel = Math.max(
        longestLabel,
        measureTextWidth(
          header,
          fontFamily,
          fontSize,
        ),
      );
    }
    return longestLabel;
  },
);
metadataHeadersLengthMemo.metadataTotalLengthMemo = "metadata-headers-length";

const metadataTotalLengthMemo = (tree) => {
  return tree.getMetadataColumnWidth() * (tree.props.blocks || EmptyArray).length;
};
maxLabelWidthMemo.metadataTotalLengthMemo = "metadata-total-length";

const pixelOffsetsMemo = memoise(
  (tree) => tree.getTreeType(),
  (tree) => (tree.getShowShapes() ? tree.getNodeSize() : 0),
  (tree) => (tree.hasLeafLabels() ? maxLabelWidthMemo(tree) : 0),
  (tree) => (tree.hasMetadataHeaders() ? metadataHeadersLengthMemo(tree) : 0),
  (tree) => (tree.hasMetadata() ? metadataTotalLengthMemo(tree) : 0),
  (
    treeType,
    visibleNodeSize,
    maxLabelWidth,
    metadataHeaderHeight,
    metadataTotalLength,
  ) => {
    let length = 0;

    length += visibleNodeSize;
    length += maxLabelWidth;

    length += metadataTotalLength;

    let preX = 0;
    let postX = 0;
    let preY = 0;
    let postY = 0;
    switch (treeType) {
      case TreeTypes.Rectangular:
      case TreeTypes.Diagonal:
        preY = Math.max(
          metadataHeaderHeight,
          visibleNodeSize / 2,
        );
        postX = length;
        postY = visibleNodeSize / 2;
        break;
      case TreeTypes.Hierarchical:
        preX = Math.max(
          metadataHeaderHeight,
          visibleNodeSize / 2,
        );
        postY = length;
        preY = visibleNodeSize / 2;
        break;
      case TreeTypes.Circular:
      case TreeTypes.Radial:
        preX = length;
        preY = length;
        postX = length;
        postY = length;
        break;
    }

    const left = preX;
    const top = preY;
    const right = postX;
    const bottom = postY;

    return {
      length: visibleNodeSize + maxLabelWidth,
      left,
      top,
      right,
      bottom,
    };
  }
);
pixelOffsetsMemo.displayName = "pixel-offsets";

export default function getPixelOffsets() {
  return pixelOffsetsMemo(this);
}

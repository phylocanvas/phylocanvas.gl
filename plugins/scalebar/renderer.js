import memoise from "../../utils/memoise";

import ScalebarLayer from "./scalebar-layer";
import scalebarOptionsMemo from "./options";

const LOG10 = Math.log(10);

const canvasCentreMemo = memoise(
  (tree) => tree.getCanvasSize(),
  (
    size,
  ) => {
    const canvasCentre = [
      size.width / 2,
      size.height / 2,
    ];
    return canvasCentre;
  }
);

function getPathToRoot(node) {
  const path = [];
  let currentNode = node.parent;
  while (currentNode) {
    path.unshift(currentNode.id);
    currentNode = currentNode.parent;
  }
  return path;
}

export default () => memoise(
  scalebarOptionsMemo,
  (tree) => tree.getBranchScale(),
  (tree) => tree.getScale(true),
  (tree) => tree.getCanvasSize(),
  (tree) => tree.getFontFamily(),
  canvasCentreMemo,
  (tree) => tree.getView().target,
  (tree) => tree.getGraphAfterLayout(),
  (tree) => tree.props.selectedIds,
  (
    options,
    branchScale,
    scale,
    size,
    fontFamily,
    canvasCentre,
    viewportCentre,
    graph,
    selectedIds,
  ) => {
    const width = options.width;
    const padding = options.padding;
    const { position } = options;
    const height = options.height;

    let x = 0;
    if (typeof position.left !== "undefined") {
      x = position.left;
    }
    else if (typeof position.centre !== "undefined") {
      x = (size.width / 2) - (width / 2) + position.centre;
    }
    else if (typeof position.right !== "undefined") {
      x = size.width - width - position.right;
    }
    else {
      console.error(
        "Invalid horizontal position specified. Supported values are `left`, `centre`, or `right`"
      );
    }

    let y = 0;
    if (typeof position.top !== "undefined") {
      y = position.top;
    }
    else if (typeof position.middle !== "undefined") {
      y = (size.height / 2) - height + position.middle;
    }
    else if (typeof position.bottom !== "undefined") {
      y = (size.height) - height - position.bottom;
    }
    else {
      console.error(
        "Invalid vertical position specified. Supported values are `top`, `middle`, or `bottom`"
      );
    }

    const scaleValue = (width - padding * 2) / branchScale / scale;
    const minDigitis = parseInt(Math.abs(Math.log(scaleValue) / LOG10), 10);

    x += -canvasCentre[0];
    x /= scale;
    x += viewportCentre[0];

    y += -canvasCentre[1];
    y /= scale;
    y += viewportCentre[1];

    const left = (padding + options.lineWidth) / scale;
    const right = (width - padding - options.lineWidth) / scale;
    const bottom = (options.height - padding) / scale;

    const labels = [
      {
        position: [
          x + (options.width / scale) / 2,
          y + bottom,
        ],
        text: scaleValue.toFixed(minDigitis + options.digits),
      },
    ];

    if (selectedIds?.length === 2) {
      const firstNode = graph.ids[selectedIds[0]];
      const secondNode = graph.ids[selectedIds[1]];
      if (firstNode && secondNode) {
        const firstNodePath = getPathToRoot(firstNode);
        const secondNodePath = getPathToRoot(secondNode);
        let index = 0;
        for (let i = 0; i < firstNodePath.length; i++) {
          if (firstNodePath[i] !== secondNodePath[i]) {
            break;
          }
          index = i;
        }
        const commonParentNode = graph.ids[firstNodePath?.[index]];

        if (commonParentNode) {
          const distance = (
            (firstNode.distanceFromRoot || 0) 
            +
            (secondNode.distanceFromRoot || 0)
            -
            (commonParentNode.distanceFromRoot || 0) * 2
          );

          const roundedDistance = (
            distance.toFixed(
              parseInt(Math.abs(Math.log(distance) / LOG10))
              +
              options.digits
            )
          );

          labels.push({
            position: [
              x + (options.width / scale) / 2,
              y,
            ],
            text: `d\u2009=\u2009${roundedDistance}`,
          });
        }
      }
    }
 
    const layer = new ScalebarLayer({
      id: "scalebar-plugin",
      data: {
        labels,
        lines: [
          {
            sourcePosition: [ x + left, y + bottom],
            targetPosition: [ x + right, y + bottom],
          },
        ],
      },
      fontSize: options.fontSize,
      fontColour: options.fillColour,
      fontFamily: options.fontFamily || fontFamily,
      lineColour: options.strokeColour,
      lineWidth: options.lineWidth,
      backgroundColour: options.background,
    });

    return layer;
  }
);

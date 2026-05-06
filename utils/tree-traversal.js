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

// https://en.wikipedia.org/wiki/Tree_traversal#Post-order
function getPostorderTraversal(rootNode) {
  const nodes = [];
  const queue = [ rootNode ];

  while (queue.length) {
    const node = queue.pop();
    if (node.children) {
      Array.prototype.push.apply(queue, node.children);
    }
    nodes.push(node);
  }

  return nodes.reverse();
}

// https://en.wikipedia.org/wiki/Tree_traversal#Pre-order
function getPreorderTraversal(rootNode) {
  const nodes = [];
  const queue = [ rootNode ];

  while (queue.length) {
    const node = queue.shift();
    nodes.push(node);
    if (node.children) {
      Array.prototype.unshift.apply(queue, node.children);
    }
  }

  return nodes;
}

export default function treeTraversal(rootNode, { trimQuotes = true } = {}) {
  performance.mark("getPostorderTraversal");
  const postorderTraversal = getPostorderTraversal(rootNode);
  performance.measure("    getPostorderTraversal", "getPostorderTraversal");
  performance.mark("getPreorderTraversal");
  const preorderTraversal = getPreorderTraversal(rootNode);
  performance.measure("    getPreorderTraversal", "getPreorderTraversal");

  // Detect cladograms
  const isCladogram = postorderTraversal.every((x) => (x.branchLength || x.branch_length || 0) === 0);
  if (isCladogram) {
    rootNode.branchLength = 0;
    for (let nodeIndex = 0; nodeIndex < preorderTraversal.length; nodeIndex++) {
      const node = preorderTraversal[nodeIndex];
      if (node.children) {
        for (const child of node.children) {
          child.branchLength = 1e-9;
        }
      }
    }
  }

  performance.mark("bottom-up traversal");
  // bottom-up traversal starting from leaves to root
  for (let nodeIndex = 0; nodeIndex < postorderTraversal.length; nodeIndex++) {
    const node = postorderTraversal[nodeIndex];
    node.postIndex = nodeIndex;
    node.isLeaf = !Array.isArray(node.children);
    node.branchLength = Math.abs(node.branchLength || node.branch_length || 0);
    delete node.branch_length;
    if (node.isLeaf && typeof node.name === "string") {
      if (trimQuotes) {
        node.id = node.name.trim().replace(/^['"]|['"]$/g, "");
      } else {
        node.id = node.name;
      }
      delete node.name;
    }
    node.totalNodes = 1;
    node.totalLeaves = 1;
    node.totalSubtreeLength = 0;
    if (!node.isLeaf) {
      node.totalNodes = 1;
      node.totalLeaves = 0;
      let totalSubtreeLength = 0;
      for (const child of node.children) {
        node.totalNodes += child.totalNodes;
        node.totalLeaves += child.totalLeaves;
        if (child.totalSubtreeLength + child.branchLength > totalSubtreeLength) {
          totalSubtreeLength = child.totalSubtreeLength + child.branchLength;
        }
        child.parent = node;
      }
      node.totalSubtreeLength = totalSubtreeLength;
    }
  }
  performance.measure("    bottom-up traversal", "bottom-up traversal");

  performance.mark("top-down traversal");
  const nodeById = {};
  // top-down traversal starting from root to leaves
  for (let nodeIndex = 0; nodeIndex < preorderTraversal.length; nodeIndex++) {
    const node = preorderTraversal[nodeIndex];
    node.preIndex = nodeIndex;
    if (!node.id) {
      node.id = `__${nodeIndex.toString()}`;
    }
    nodeById[node.id] = node;
    node.visibleLeaves = node.totalLeaves;
    node.isCollapsed = false;
    node.isHidden = false;
  }
  performance.measure("    top-down traversal", "top-down traversal");

  return {
    nodeById,
    rootNode,
    postorderTraversal,
    preorderTraversal,
  };
}

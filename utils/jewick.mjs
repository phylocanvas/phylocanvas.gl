/**
 * Newick format parser in JavaScript.
 *
 * Copyright (c) edited by Miguel Pignatelli 2014, based on Jason Davies 2010.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Example tree (from http://en.wikipedia.org/wiki/Newick_format):
 *
 * +--0.1--A
 * F-----0.2-----B            +-------0.3----C
 * +------------------0.5-----E
 *                            +---------0.4------D
 *
 * Newick format:
 * (A:0.1,B:0.2,(C:0.3,D:0.4)E:0.5)F;
 *
 * Converted to JSON:
 * {
 *   name: "F",
 *   children: [
 *     {name: "A", branch_length: 0.1},
 *     {name: "B", branch_length: 0.2},
 *     {
 *       name: "E",
 *       length: 0.5,
 *       children: [
 *         {name: "C", branch_length: 0.3},
 *         {name: "D", branch_length: 0.4}
 *       ]
 *     }
 *   ]
 * }
 *
 * Converted to JSON, but with no names or lengths:
 * {
 *   children: [
 *     {}, {}, {
 *       children: [{}, {}]
 *     }
 *   ]
 * }
 */

/*
["Bovine",0.69395,["Gibbon","Mouse",1.21460],1]
{
  "children": [
    {
      "name": "Bovine",
      "branch_length": 0.69395
    },
    {
      "name": "",
      "children": [
        {
          "name": "Gibbon"
          "branch_length": 1
        },
        {
          "name": "Mouse",
          "branch_length": 1.2146
        }
      ],
      "branch_length": 1
    }
  ],
  "name": ""
}
*/

export default function (source) {
	let lastLeaf;
	const root = { children:[], name: "", branch_length: 0 };
	const queue = [
		[
			root,
			source,
		]
	];
	while (queue.length) {
		const [subtree, node] = queue.shift();
		for (const item of node) {
			if (typeof item === "string") {
				lastLeaf = { name: "", branch_length: 0 }
				subtree.children.push(lastLeaf);
				lastLeaf.name = item;
			}
			else if (typeof item === "number") {
				lastLeaf.branch_length = item;
			}
			else if (Array.isArray(item)) {
				lastLeaf = { children:[], name: "", branch_length: 0 };
				subtree.children.push(lastLeaf);
				queue.push([lastLeaf, item]);
			}
		}
	}
	return root;
};

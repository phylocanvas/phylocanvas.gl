# About Phylocanvas.gl


## Q1: What is Phylocanvas.gl?

A WebGL-powered JavaScript library for large tree visualisation, scaling to hundreds of thousands of leaves.


## Q2: Is this the new version of [Phylocanvas](https://www.npmjs.com/package/phylocanvas)?

No, Phylocanvas.gl is a completely new library for tree visualisation, written to incorporate WebGL.
This is not version 3 of [Phylocanvas](https://www.npmjs.com/package/phylocanvas).



## Q3: Why yet another library?


|  | Phylocanvas | Phylocanvas.gl |
| ------ | ------ | ------ |
| Website | <https://phylocanvas.org/> | <https://www.phylocanvas.gl/> |
| license | [LGPL](https://github.com/phylocanvas/phylocanvas/blob/master/LICENCE) | [MIT](https://gitlab.com/cgps/phylocanvas/phylocanvas.gl/-/blob/master/LICENSE) |
| Source code | https://github.com/phylocanvas/phylocanvas | https://gitlab.com/cgps/phylocanvas/phylocanvas.gl |
| Requires [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) | Yes | No |
| Requires [WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)| No | Yes |
| NPM Package | <https://www.npmjs.com/package/phylocanvas> | <https://www.npmjs.com/package/@phylocanvas/phylocanvas.gl> |


## Q4: Where can I find documentation?

Examples and API documentation at [https://www.phylocanvas.gl/](https://www.phylocanvas.gl/).



## Q5: Does Phylocanvas.gl work without WebGL? 

No, Phylocanvas.gl only works on web browsers which support WebGL.
Rendering using [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) is slow and does not scale to trees with hundreds of thousands of leaves.

Most modern browsers do support WebGL (https://caniuse.com/webgl2),
therefore Phylocanvas.gl does not fallback to Canvas API when WebGL is not supported or disabled.
Consider upgrading your browser if you get the following error when creating a new PhylocanvasGL instance:
`WebGL context: WebGL is currently disabled`.


## Q6: I found a bug, where can I report it?

For bugs and suggestions, please raise an issue on <https://gitlab.com/cgps/phylocanvas/support>.


## Q7: Can I fork Phylocanvas.gl?

Phylocanvas is primarily designed to be incorporated into CGPS software that display phylogenies. The scope of Phylocanvas is limited to the software tools of CGPS and, for this purpose, it is considered to be feature complete.

We provide this software as is, under [MIT license](https://gitlab.com/cgps/phylocanvas/phylocanvas.gl/-/blob/master/LICENSE), for the benefit and use of the community, however we are unable to provide support for its use or modification.

You are not granted rights or licenses to the trademarks of the CGPS or any party, including without limitation the Phylocanvas name or logo.
If you fork the project and publish it, please choose another name.


## Q8: How can I cite Phylocanvas.gl?

If you use Phylocanvas.gl within a publication please cite: [Phylocanvas.gl: A WebGL-powered JavaScript library for large tree visualisation](https://osf.io/nfv6m).


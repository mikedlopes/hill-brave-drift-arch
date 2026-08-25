import { i as __toESM } from "../_runtime.mjs";
import { a as useLoader, g as require_react, h as require_jsx_runtime, i as Canvas, n as Center, r as OrbitControls, t as ContactShadows } from "../_libs/@react-three/drei+[...].mjs";
import { a as Box, i as Download, n as RotateCw, r as Layers } from "../_libs/lucide-react.mjs";
import { t as STLLoader } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DDKVMokW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FILAMENT = "#e24a1c";
var LID_Z = 8.05;
function StlPart({ url, position }) {
	const geom = useLoader(STLLoader, url);
	(0, import_react.useLayoutEffect)(() => {
		geom.computeVertexNormals();
		geom.computeBoundingBox();
	}, [geom]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("mesh", {
		geometry: geom,
		position,
		castShadow: true,
		receiveShadow: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
			color: FILAMENT,
			roughness: .42,
			metalness: .06,
			envMapIntensity: .4
		})
	});
}
function Scene({ view }) {
	const parts = (0, import_react.useMemo)(() => {
		if (view === "lid") return [{ url: "/models/pi_zero_case_lid.stl" }];
		if (view === "bottom") return [{ url: "/models/pi_zero_case_bottom.stl" }];
		return [{ url: "/models/pi_zero_case_bottom.stl" }, {
			url: "/models/pi_zero_case_lid.stl",
			position: [
				0,
				0,
				LID_Z
			]
		}];
	}, [view]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Center, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
		rotation: [
			-Math.PI / 2,
			0,
			0
		],
		children: parts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StlPart, {
			url: p.url,
			position: p.position
		}, p.url + (p.position?.join(",") ?? "")))
	}) });
}
function CaseViewer({ view, autoRotate }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Canvas, {
		className: "h-full w-full touch-none",
		dpr: [1, 2],
		shadows: true,
		gl: {
			antialias: true,
			alpha: false
		},
		camera: {
			position: [
				42,
				36,
				58
			],
			fov: 32,
			near: .5,
			far: 400
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("color", {
				attach: "background",
				args: ["#111110"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ambientLight", { intensity: .38 }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hemisphereLight", { args: [
				"#ffd7c2",
				"#1c1814",
				.65
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
				position: [
					50,
					70,
					28
				],
				intensity: 1.55,
				castShadow: true,
				"shadow-mapSize-width": 1024,
				"shadow-mapSize-height": 1024
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
				position: [
					-40,
					24,
					-18
				],
				intensity: .32
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("spotLight", {
				position: [
					0,
					90,
					10
				],
				intensity: .45,
				angle: .45,
				penumbra: .6
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
				fallback: null,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scene, { view })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContactShadows, {
				position: [
					0,
					-12,
					0
				],
				opacity: .38,
				scale: 90,
				blur: 2.4,
				far: 28,
				color: "#0a0908"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrbitControls, {
				makeDefault: true,
				enableDamping: true,
				dampingFactor: .08,
				autoRotate,
				autoRotateSpeed: .7,
				minDistance: 38,
				maxDistance: 140,
				maxPolarAngle: Math.PI / 1.55
			})
		]
	});
}
var VIEWS = [
	{
		id: "lid",
		label: "Voronoi lid"
	},
	{
		id: "bottom",
		label: "Tray"
	},
	{
		id: "assembled",
		label: "Assembled"
	}
];
function Home() {
	const [view, setView] = (0, import_react.useState)("lid");
	const [autoRotate, setAutoRotate] = (0, import_react.useState)(true);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaseViewer, {
					view,
					autoRotate
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "pointer-events-none absolute inset-x-0 top-0 z-10 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto max-w-md rounded-xl border border-border bg-surface/90 p-4 shadow-panel backdrop-blur-md sm:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-[0.16em] text-muted uppercase",
							children: "Raspberry Pi Zero"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-1 font-display text-3xl leading-tight text-fg italic sm:text-4xl",
							children: "Voronoi lid"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-sm text-sm leading-relaxed text-muted",
							children: "Organic honeycomb lattice across the full lid, nested lip, and corner pads — matching the printed case. Drag to orbit."
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:top-1/2 sm:right-6 sm:bottom-auto sm:-translate-y-1/2 sm:p-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto mx-auto flex max-w-lg flex-col gap-2 rounded-xl border border-border bg-surface/90 p-2 shadow-panel backdrop-blur-md sm:w-56",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-1 sm:grid-cols-1",
							children: VIEWS.map((item) => {
								const active = view === item.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setView(item.id),
									className: "min-h-11 rounded-md px-3 text-sm font-medium transition-colors duration-150 " + (active ? "bg-accent text-accent-fg" : "text-fg hover:bg-elevated"),
									children: item.label
								}, item.id);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hidden h-px bg-border sm:block" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setAutoRotate((v) => !v),
							className: "flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm text-muted hover:bg-elevated hover:text-fg sm:justify-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, {
								className: "size-4",
								strokeWidth: 1.75
							}), autoRotate ? "Stop spin" : "Auto-rotate"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "/models/pi_zero_case_lid.stl",
							download: true,
							className: "flex min-h-11 items-center justify-center gap-2 rounded-md bg-filament px-3 text-sm font-medium text-fg hover:bg-filament-deep",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
								className: "size-4",
								strokeWidth: 1.75
							}), "Lid STL"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "/models/pi_zero_case_bottom.stl",
							download: true,
							className: "flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-fg hover:bg-elevated",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Box, {
								className: "size-4",
								strokeWidth: 1.75
							}), "Tray STL"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "hidden px-2 pb-1 text-[11px] leading-snug text-subtle sm:flex sm:items-start sm:gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, {
								className: "mt-0.5 size-3.5 shrink-0",
								strokeWidth: 1.75
							}), "70 × 34.8 mm · 1.28 mm lattice walls"]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { Home as component };
